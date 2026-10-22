import { and, asc, desc, eq, sql } from "drizzle-orm";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { symmetricEncrypt, symmetricDecrypt } from "better-auth/crypto";
import { db } from "../database/index.js";
import {
  favorites,
  products,
  newsletterSubscriptions,
  newsletterTokens,
  notificationPreferences,
  outbox,
  user,
} from "../database/schema.js";
import { readPublicCatalog, productVisible } from "./public-catalog.js";
import { productDetails } from "./catalog-search.js";
import { activeOwner, domainError as error } from "./account-state.js";
import { betterAuthSecret, clientUrl } from "../lib/utils/environment.js";
import { sendNewsletterEmail } from "../lib/email/mailer.js";
const hash = (token) => createHash("sha256").update(token).digest("hex");
export const pageInput = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export async function favoriteList(userId, raw = {}) {
  const { page, limit } = pageInput.parse(raw);
  const where = and(eq(favorites.userId, userId), productVisible());
  const [{ total }] = await db
    .select({ total: sql`count(*)::int` })
    .from(favorites)
    .innerJoin(products, eq(products.id, favorites.productId))
    .where(where);
  const rows = await db
    .select({ productId: favorites.productId })
    .from(favorites)
    .innerJoin(products, eq(products.id, favorites.productId))
    .where(where)
    .orderBy(desc(favorites.createdAt), asc(favorites.productId))
    .limit(limit)
    .offset((page - 1) * limit);
  const items = [];
  for (const row of rows) {
    const item = await readPublicCatalog("products", {}, { id: row.productId });
    if (item) items.push(item);
  }
  return { items, total, page, limit };
}
export async function setFavorite(userId, id, enabled) {
  z.uuid().parse(id);
  return db.transaction(async (tx) => {
    await activeOwner(tx, userId);
    if (enabled) {
      const [visible] = await tx
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, id), productVisible()));
      if (!visible) throw error("Sản phẩm không còn được mở bán.", 404);
      await tx
        .insert(favorites)
        .values({ userId, productId: id })
        .onConflictDoNothing();
    } else
      await tx
        .delete(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.productId, id)));
    return { productId: id, favorite: enabled };
  });
}
export async function comparison(raw) {
  const { variantIds } = z
    .object({ variantIds: z.array(z.uuid()).min(1).max(4) })
    .strict()
    .parse(raw);
  if (new Set(variantIds).size !== variantIds.length)
    throw error("Không chọn trùng SKU.", 400);
  const rows = await db.execute(
    sql`select id,product_id from product_variant where id in (${sql.join(
      variantIds.map((id) => sql`${id}::uuid`),
      sql`,`,
    )})`,
  );
  const items = [];
  for (const id of variantIds) {
    const row = rows.rows.find((r) => r.id === id),
      detail = row ? await productDetails(row.product_id) : null;
    const variant = detail?.variants.find((v) => v.id === id);
    if (!detail || !variant) throw error("SKU không còn được mở bán.", 404);
    items.push({
      product: detail.product,
      variant,
      attributes: variant.attributes,
      media: detail.media.filter((m) => !m.variantId || m.variantId === id),
    });
  }
  if (new Set(items.map((i) => i.product.productType)).size !== 1)
    throw error("Chỉ so sánh các SKU cùng loại sản phẩm.", 400);
  return { items };
}
export async function preferences(userId, raw) {
  if (raw === undefined)
    return (
      (
        await db
          .select({
            transactional: notificationPreferences.transactional,
            marketing: notificationPreferences.marketing,
          })
          .from(notificationPreferences)
          .where(eq(notificationPreferences.userId, userId))
      )[0] ?? { transactional: true, marketing: false }
    );
  const data = z
    .object({ transactional: z.boolean(), marketing: z.boolean() })
    .strict()
    .parse(raw);
  return db.transaction(async (tx) => {
    await activeOwner(tx, userId);
    await tx
      .insert(notificationPreferences)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: { ...data, updatedAt: new Date() },
      });
    return data;
  });
}
async function newsletterToken(tx, subscription, purpose) {
  const token = randomBytes(32).toString("base64url"),
    expiresAt = new Date(
      Date.now() + (purpose === "confirm" ? 86400000 : 90 * 86400000),
    );
  await tx
    .insert(newsletterTokens)
    .values({
      subscriptionId: subscription.id,
      purpose,
      hash: hash(token),
      generation: subscription.generation,
      expiresAt,
    });
  const encryptedToken = await symmetricEncrypt({
    key: betterAuthSecret,
    data: token,
  });
  await tx
    .insert(outbox)
    .values({
      key: `newsletter:${hash(token)}`,
      kind: "newsletter_email",
      payload: { subscriptionId: subscription.id, purpose, encryptedToken },
    });
  return token;
}
export async function subscribeNewsletter(raw) {
  const input = z
    .object({
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase().trim()),
      consent: z.literal(true),
      source: z.enum(["footer", "contact", "account"]).default("footer"),
    })
    .strict()
    .parse(raw);
  await db.transaction(async (tx) => {
    await tx
      .insert(newsletterSubscriptions)
      .values({
        email: input.email,
        source: input.source,
        consentedAt: new Date(),
      })
      .onConflictDoNothing();
    let [sub] = await tx
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, input.email))
      .for("update");
    if (sub.state === "confirmed") return;
    // Supersede all earlier links on a new consent; an old link cannot re-subscribe later.
    [sub] = await tx
      .update(newsletterSubscriptions)
      .set({
        state: "pending",
        generation: sub.generation + 1,
        consentedAt: new Date(),
        source: input.source,
        updatedAt: new Date(),
      })
      .where(eq(newsletterSubscriptions.id, sub.id))
      .returning();
    await newsletterToken(tx, sub, "confirm");
  });
  return {
    message: "Đã tiếp nhận yêu cầu. Vui lòng kiểm tra email để xác nhận.",
  };
}
export async function newsletterAction(raw) {
  const input = z
    .object({
      token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
      purpose: z.enum(["confirm", "unsubscribe"]),
    })
    .strict()
    .parse(raw);
  return db.transaction(async (tx) => {
    const [token] = await tx
      .select()
      .from(newsletterTokens)
      .where(eq(newsletterTokens.hash, hash(input.token)));
    if (!token || token.purpose !== input.purpose)
      throw error("Liên kết không hợp lệ.", 400);
    const [sub] = await tx
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.id, token.subscriptionId))
      .for("update");
    const [live] = await tx
      .select()
      .from(newsletterTokens)
      .where(eq(newsletterTokens.id, token.id))
      .for("update");
    if (live.usedAt) return { status: "already_processed" };
    if (
      new Date(live.expiresAt) <= new Date() ||
      live.generation !== sub.generation
    )
      throw error("Liên kết đã hết hạn hoặc được thay thế.", 400);
    if (input.purpose === "confirm") {
      if (sub.state !== "pending")
        throw error("Yêu cầu xác nhận không còn hiệu lực.", 400);
      await tx
        .update(newsletterSubscriptions)
        .set({
          state: "confirmed",
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(newsletterSubscriptions.id, sub.id));
      await newsletterToken(tx, sub, "unsubscribe");
    } else
      await tx
        .update(newsletterSubscriptions)
        .set({
          state: "unsubscribed",
          unsubscribedAt: new Date(),
          generation: sub.generation + 1,
          updatedAt: new Date(),
        })
        .where(eq(newsletterSubscriptions.id, sub.id));
    await tx
      .update(newsletterTokens)
      .set({ usedAt: new Date() })
      .where(eq(newsletterTokens.id, token.id));
    return {
      status: input.purpose === "confirm" ? "confirmed" : "unsubscribed",
    };
  });
}
export async function dispatchNewsletter(payload) {
  const token = await symmetricDecrypt({
    key: betterAuthSecret,
    data: payload.encryptedToken,
  });
  const [record] = await db
    .select()
    .from(newsletterTokens)
    .where(eq(newsletterTokens.hash, hash(token)));
  const [sub] = record
    ? await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.id, record.subscriptionId))
    : [];
  if (
    !record ||
    !sub ||
    record.usedAt ||
    record.generation !== sub.generation ||
    new Date(record.expiresAt) <= new Date()
  )
    return;
  if (
    (record.purpose === "confirm" && sub.state !== "pending") ||
    (record.purpose === "unsubscribe" && sub.state !== "confirmed")
  )
    return;
  const url = new URL("/newsletter", clientUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("purpose", record.purpose);
  await sendNewsletterEmail({
    email: sub.email,
    purpose: record.purpose,
    url: url.href,
  });
}
export async function transactionalEmailAllowed(userId) {
  const [owner] = await db
    .select({ anonymizedAt: user.anonymizedAt })
    .from(user)
    .where(eq(user.id, userId));
  if (!owner || owner.anonymizedAt) return false;
  return (await preferences(userId)).transactional;
}

export async function favoriteStatus(userId, id) {
  return {
    favorite: Boolean(
      (
        await db
          .select()
          .from(favorites)
          .where(and(eq(favorites.userId, userId), eq(favorites.productId, id)))
      )[0],
    ),
  };
}
