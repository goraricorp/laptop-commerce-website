import { activeOwner } from "../services/account-state.js";
import { Router } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/index.js";
import {
  carts,
  cartItems,
  products,
  productVariants,
  productMedia,
} from "../database/schema.js";
import { requireAuth } from "../middlewares/auth.js";
import { clientUrl } from "../lib/utils/environment.js";
const router = Router();
const itemInput = z
  .object({
    variantId: z.uuid(),
    quantity: z.number().int().min(1).max(99),
  })
  .strict();
router.use("/me/cart", requireAuth, (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (
    req.method !== "GET" &&
    (req.get("sec-fetch-site") === "cross-site" ||
      (req.get("origin") && req.get("origin") !== clientUrl))
  )
    return res.status(403).json({
      message: "Origin không được phép.",
    });
  return next();
});
async function readCart(tx, cart) {
  const rows = await tx
    .select({
      item: cartItems,
      variant: productVariants,
      product: products,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));
  const media = rows.length
    ? await tx
        .select()
        .from(productMedia)
        .where(
          inArray(
            productMedia.productId,
            rows.map((row) => row.product.id),
          ),
        )
    : [];
  return rows.map(({ item, variant, product }) => ({
    id: variant.id,
    variantId: variant.id,
    productId: product.id,
    name: product.name,
    variantName: variant.name,
    price: Number(variant.price),
    quantity: item.quantity,
    selected: true,
    image: (
      media.find((m) => m.productId === product.id && m.isPrimary) ??
      media.find((m) => m.productId === product.id)
    )?.url,
  }));
}
async function access(userId, action) {
  return db.transaction(async (tx) => {
    await activeOwner(tx, userId);
    let cart = (
      await tx
        .select()
        .from(carts)
        .where(and(eq(carts.userId, userId), eq(carts.status, "active")))
    )[0];
    cart ??= (
      await tx
        .insert(carts)
        .values({
          userId,
        })
        .returning()
    )[0];
    await action?.(tx, cart);
    return readCart(tx, cart);
  });
}
async function writeItem(tx, cart, input, mode) {
  const variant = (
    await tx
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, input.variantId))
  )[0];
  if (!variant)
    throw Object.assign(new Error("Không tìm thấy sản phẩm."), {
      status: 404,
    });
  const owned = and(
    eq(cartItems.cartId, cart.id),
    eq(cartItems.variantId, input.variantId),
  );
  const old = (await tx.select().from(cartItems).where(owned))[0];
  const quantity =
    mode === "adjust"
      ? Math.min(99, Math.max(1, (old?.quantity ?? 1) + input.delta))
      : mode === "add"
        ? Math.min(99, (old?.quantity ?? 0) + input.quantity)
        : mode === "merge"
          ? Math.max(old?.quantity ?? 0, input.quantity)
          : input.quantity;
  if (old)
    await tx
      .update(cartItems)
      .set({
        quantity,
        unitPrice: variant.price,
        updatedAt: new Date(),
      })
      .where(owned);
  else
    await tx.insert(cartItems).values({
      cartId: cart.id,
      variantId: variant.id,
      quantity,
      unitPrice: variant.price,
    });
}
router.get("/me/cart", async (req, res) => {
  return res.status(200).json(await access(req["user"].id));
});
router.post("/me/cart/merge", async (req, res) => {
  const items = z.array(itemInput).max(100).parse(req["body"].items);
  return res.status(200).json(
    await access(req["user"].id, async (tx, cart) => {
      for (const item of items) {
        const exists = (
          await tx
            .select({
              id: productVariants.id,
            })
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId))
        )[0];
        if (exists) await writeItem(tx, cart, item, "merge");
      }
    }),
  );
});
for (const method of ["post", "put"])
  router[method]("/me/cart/items", async (req, res) => {
    const item = itemInput.parse(req["body"]);
    return res
      .status(200)
      .json(
        await access(req["user"].id, (tx, cart) =>
          writeItem(tx, cart, item, method === "post" ? "add" : "set"),
        ),
      );
  });
router.patch("/me/cart/items/adjust", async (req, res) => {
  const data = z
    .object({
      variantId: z.uuid(),
      delta: z
        .number()
        .int()
        .min(-99)
        .max(99)
        .refine((value) => value !== 0),
    })
    .strict()
    .parse(req["body"]);
  return res
    .status(200)
    .json(
      await access(req["user"].id, (tx, cart) =>
        writeItem(tx, cart, data, "adjust"),
      ),
    );
});
router.delete("/me/cart/items/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  return res
    .status(200)
    .json(
      await access(req["user"].id, (tx, cart) =>
        tx
          .delete(cartItems)
          .where(
            and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, id)),
          ),
      ),
    );
});
router.delete("/me/cart", async (req, res) => {
  return res
    .status(200)
    .json(
      await access(req["user"].id, (tx, cart) =>
        tx.delete(cartItems).where(eq(cartItems.cartId, cart.id)),
      ),
    );
});
export default router;
