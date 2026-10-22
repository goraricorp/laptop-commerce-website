import { eq } from "drizzle-orm";
import { db } from "../database/index.js";
import {
  promotionCodes,
  promotionUsages,
  promotions,
} from "../database/schema.js";
export async function getPromotions() {
  return await db.select().from(promotions);
}
export async function getPromotion(id) {
  return (
    (
      await db.select().from(promotions).where(eq(promotions.id, id)).limit(1)
    )[0] ?? null
  );
}
export async function createPromotion(data) {
  return (await db.insert(promotions).values(data).returning())[0];
}
export async function updatePromotion(id, data) {
  return (
    (
      await db
        .update(promotions)
        .set(data)
        .where(eq(promotions.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deletePromotion(id) {
  return (
    (await db.delete(promotions).where(eq(promotions.id, id)).returning())[0] ??
    null
  );
}
export async function getPromotionCodes() {
  return await db.select().from(promotionCodes);
}
export async function getPromotionCode(id) {
  return (
    (
      await db
        .select()
        .from(promotionCodes)
        .where(eq(promotionCodes.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createPromotionCode(data) {
  return (await db.insert(promotionCodes).values(data).returning())[0];
}
export async function updatePromotionCode(id, data) {
  return (
    (
      await db
        .update(promotionCodes)
        .set(data)
        .where(eq(promotionCodes.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deletePromotionCode(id) {
  return (
    (
      await db
        .delete(promotionCodes)
        .where(eq(promotionCodes.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function getPromotionUsages() {
  return await db.select().from(promotionUsages);
}
export async function getPromotionUsage(id) {
  return (
    (
      await db
        .select()
        .from(promotionUsages)
        .where(eq(promotionUsages.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createPromotionUsage(data) {
  return (await db.insert(promotionUsages).values(data).returning())[0];
}
export async function updatePromotionUsage(id, data) {
  return (
    (
      await db
        .update(promotionUsages)
        .set(data)
        .where(eq(promotionUsages.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deletePromotionUsage(id) {
  return (
    (
      await db
        .delete(promotionUsages)
        .where(eq(promotionUsages.id, id))
        .returning()
    )[0] ?? null
  );
}
