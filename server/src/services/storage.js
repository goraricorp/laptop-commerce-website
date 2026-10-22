import { sql, and, eq, inArray, lt, or } from "drizzle-orm";
import { db } from "../database/index.js";
import {
  campaigns,
  uploadAssets,
  categories,
  brands,
  productMedia,
  productContentSections,
  user,
  messageAttachments,
} from "../database/schema.js";
import { deleteObject } from "../lib/upload/s3-client.js";
import process from "node:process";
const refs = [
  [campaigns, campaigns.imageUrl],
  [categories, categories.imageUrl],
  [brands, brands.logoUrl],
  [productMedia, productMedia.url],
  [productContentSections, productContentSections.imageUrl],
  [user, user.image],
  [messageAttachments, messageAttachments.url],
];
export async function assetReferenced(tx, url) {
  for (const [table, column] of refs)
    if (
      (
        await tx
          .select({ url: column })
          .from(table)
          .where(eq(column, url))
          .limit(1)
      )[0]
    )
      return true;
  return false;
}
// Reference checks and row locks prevent cleanup from deleting an image while a catalog form saves it.
export async function deleteAsset(key, actor, { expiredOnly = false } = {}) {
  return db.transaction(async (tx) => {
    const [asset] = await tx
      .select()
      .from(uploadAssets)
      .where(eq(uploadAssets.key, key))
      .for("update");
    if (!asset) return { deleted: true };
    if (
      actor &&
      asset.userId !== actor.id &&
      !["administrator", "master"].includes(actor.role)
    )
      throw Object.assign(new Error("Bạn không có quyền xóa ảnh này."), {
        status: 403,
      });
    if (expiredOnly && +new Date(asset.createdAt) > Date.now() - 86400000)
      return { deleted: false };
    if (await assetReferenced(tx, asset.url)) {
      await tx
        .update(uploadAssets)
        .set({ state: "attached" })
        .where(eq(uploadAssets.key, key));
      return { deleted: false, referenced: true };
    }
    await deleteObject(process.env.VITE_STORAGE_BUCKET || "public", key);
    await tx.delete(uploadAssets).where(eq(uploadAssets.key, key));
    return { deleted: true };
  });
}
export async function attachAssets(tx, urls) {
  const assets = urls.length
    ? await tx
        .select()
        .from(uploadAssets)
        .where(inArray(uploadAssets.url, urls))
        .orderBy(uploadAssets.key)
        .for("update")
    : [];
  for (const url of urls) {
    if (
      url.includes("/storage/object?key=") &&
      !assets.some((asset) => asset.url === url) &&
      !(await assetReferenced(tx, url))
    )
      throw Object.assign(
        new Error("Ảnh tạm đã bị xóa hoặc hết hạn. Vui lòng upload lại."),
        { status: 409 },
      );
  }
  for (const asset of assets)
    await tx
      .update(uploadAssets)
      .set({ state: "attached" })
      .where(eq(uploadAssets.key, asset.key));
}
export async function cleanupAssets({ limit = 100, deadline = Infinity } = {}) {
  const assets = await db
    .select()
    .from(uploadAssets)
    .where(
      or(
        eq(uploadAssets.state, "delete_pending"),
        and(
          inArray(uploadAssets.state, ["pending", "attached"]),
          lt(uploadAssets.createdAt, new Date(Date.now() - 86400000)),
        ),
      ),
    )
    .orderBy(
      sql`case when ${uploadAssets.state}='delete_pending' then 0 else 1 end`,
      sql`coalesce(${uploadAssets.checkedAt},${uploadAssets.createdAt})`,
      uploadAssets.key,
    )
    .limit(limit);
  const results = [];
  for (const asset of assets) {
    if (Date.now() >= deadline - 15000) break;
    try {
      const outcome = await deleteAsset(asset.key, null, {
        expiredOnly: asset.state === "pending",
      });
      await db
        .update(uploadAssets)
        .set({ checkedAt: new Date() })
        .where(eq(uploadAssets.key, asset.key));
      results.push({ key: asset.key, ...outcome });
    } catch {
      results.push({ key: asset.key, deleted: false, retry: true });
    }
  }
  return results;
}
export async function queueAssetCleanup(urls) {
  if (!urls.length) return;
  for (const url of new Set(urls)) {
    try {
      const parsed = new URL(url);
      const expected = new URL(
        process.env.VITE_PUBLIC_SERVER_URL || "http://localhost:5172",
      );
      const key = parsed.searchParams.get("key");
      const match = key?.match(
        /^public\/users\/([a-f0-9-]{36})\/[a-f0-9-]{36}\.(png|jpe?g|webp|gif|avif|pdf)$/i,
      );
      if (
        parsed.origin === expected.origin &&
        parsed.pathname === "/storage/object" &&
        match
      )
        await db
          .insert(uploadAssets)
          .values({ key, url, userId: match[1], state: "delete_pending" })
          .onConflictDoNothing();
    } catch {
      /* external URLs are never deleted from our bucket */
    }
  }
  await db
    .update(uploadAssets)
    .set({ state: "delete_pending" })
    .where(inArray(uploadAssets.url, urls));
  const assets = await db
    .select()
    .from(uploadAssets)
    .where(inArray(uploadAssets.url, urls));
  for (const asset of assets) {
    try {
      await deleteAsset(asset.key);
    } catch {
      /* retained in durable cleanup queue */
    }
  }
}
export async function mutateWithAssets(table, mode, id, data = {}) {
  const columns = ["url", "imageUrl", "logoUrl", "image"].filter(
    (name) => table[name],
  );
  let oldUrls = [];
  const row = await db.transaction(async (tx) => {
    const previous = id
      ? (await tx.select().from(table).where(eq(table.id, id)).for("update"))[0]
      : null;
    oldUrls = columns.map((name) => previous?.[name]).filter(Boolean);
    await attachAssets(tx, columns.map((name) => data[name]).filter(Boolean));
    if (mode === "create")
      return (await tx.insert(table).values(data).returning())[0];
    if (mode === "delete")
      return (
        (await tx.delete(table).where(eq(table.id, id)).returning())[0] ?? null
      );
    return (
      (
        await tx.update(table).set(data).where(eq(table.id, id)).returning()
      )[0] ?? null
    );
  });
  // Failed object deletion must not turn a committed database save into a client-visible save failure.
  try {
    await queueAssetCleanup(
      oldUrls.filter(
        (url) =>
          !columns.some((name) => row?.[name] === url) || mode === "delete",
      ),
    );
  } catch {
    /* periodic sweep retries orphaned attached assets */
  }
  return row;
}

export function startStorageCleanup() {
  const timerKey = Symbol.for("laptop-commerce.storage-cleanup");
  if (globalThis[timerKey] || process.env.NODE_ENV === "test") return;
  const period = Number(process.env.STORAGE_CLEANUP_INTERVAL_MS ?? 900000);
  if (!Number.isFinite(period) || period <= 0) return;
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await cleanupAssets();
    } catch {
      /* durable queue is retried next interval */
    } finally {
      running = false;
    }
  }, period);
  timer.unref?.();
  globalThis[timerKey] = timer;
}
