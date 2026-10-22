import { and, eq, count, avg, getTableColumns } from "drizzle-orm";
import { db } from "../database/index.js";
import { productVisible } from "./public-catalog.js";
import {
  productReviews,
  products,
  user,
  orderItems,
} from "../database/schema.js";
import { activeOwner } from "./account-state.js";
export async function getProductReviews() {
  return db
    .select({
      ...getTableColumns(productReviews),
      productName: products.name,
      userName: user.name,
      orderItemName: orderItems.productName,
    })
    .from(productReviews)
    .leftJoin(products, eq(products.id, productReviews.productId))
    .leftJoin(user, eq(user.id, productReviews.userId))
    .leftJoin(orderItems, eq(orderItems.id, productReviews.orderItemId));
}
const publicReviewColumns = {
  id: productReviews.id,
  productId: productReviews.productId,
  score: productReviews.score,
  title: productReviews.title,
  comment: productReviews.comment,
  status: productReviews.status,
  isVerifiedPurchase: productReviews.isVerifiedPurchase,
  createdAt: productReviews.createdAt,
  updatedAt: productReviews.updatedAt,
};
export async function getPublishedProductReviews(productId, id) {
  return db
    .select(publicReviewColumns)
    .from(productReviews)
    .innerJoin(products, eq(products.id, productReviews.productId))
    .where(
      and(
        eq(productReviews.status, "published"),
        productVisible(),
        productId ? eq(productReviews.productId, productId) : undefined,
        id ? eq(productReviews.id, id) : undefined,
      ),
    );
}
export async function getPublicProductReview(id) {
  return (await getPublishedProductReviews(undefined, id))[0] ?? null;
}
export async function getProductReview(id) {
  return (
    (
      await db
        .select()
        .from(productReviews)
        .where(eq(productReviews.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createProductReview(data) {
  try {
    return await db.transaction(async (tx) => {
      await activeOwner(tx, data.userId);
      const existing = (
        await tx
          .select({ id: productReviews.id })
          .from(productReviews)
          .where(
            and(
              eq(productReviews.userId, data.userId),
              eq(productReviews.productId, data.productId),
            ),
          )
      )[0];
      if (existing)
        throw Object.assign(
          new Error("Bạn đã đánh giá sản phẩm này. Hãy sửa đánh giá hiện có."),
          { status: 409 },
        );
      return (await tx.insert(productReviews).values(data).returning())[0];
    });
  } catch (error) {
    if (error.code === "23505" || error.cause?.code === "23505")
      throw Object.assign(new Error("Bạn đã đánh giá sản phẩm này."), {
        status: 409,
      });
    throw error;
  }
}
export async function reviewSummary(productId) {
  const [summary] = await db
    .select({ count: count(), average: avg(productReviews.score) })
    .from(productReviews)
    .innerJoin(products, eq(products.id, productReviews.productId))
    .where(
      and(
        productVisible(),
        eq(productReviews.productId, productId),
        eq(productReviews.status, "published"),
      ),
    );
  return { count: summary.count, average: Number(summary.average ?? 0) };
}
export async function updateProductReview(id, data) {
  return (
    (
      await db
        .update(productReviews)
        .set(data)
        .where(eq(productReviews.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteProductReview(id) {
  return (
    (
      await db
        .delete(productReviews)
        .where(eq(productReviews.id, id))
        .returning()
    )[0] ?? null
  );
}

export async function getOwnedReviews(userId) {
  return db
    .select()
    .from(productReviews)
    .where(eq(productReviews.userId, userId));
}
export async function updateOwnedReview(id, userId, data) {
  return (
    await db
      .update(productReviews)
      .set({ ...data, status: "pending", updatedAt: new Date() })
      .where(and(eq(productReviews.id, id), eq(productReviews.userId, userId)))
      .returning()
  )[0];
}
export async function deleteOwnedReview(id, userId) {
  return (
    await db
      .delete(productReviews)
      .where(and(eq(productReviews.id, id), eq(productReviews.userId, userId)))
      .returning()
  )[0];
}
