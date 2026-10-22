import { eq } from "drizzle-orm";
import { db } from "../database/index.js";
import { addresses, cartItems, carts } from "../database/schema.js";

export async function getAddresses() {
  return await db.select().from(addresses);
}
export async function getAddress(id) {
  return (
    (
      await db.select().from(addresses).where(eq(addresses.id, id)).limit(1)
    )[0] ?? null
  );
}
export async function createAddress(data) {
  return (await db.insert(addresses).values(data).returning())[0];
}
export async function updateAddress(id, data) {
  return (
    (
      await db
        .update(addresses)
        .set(data)
        .where(eq(addresses.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteAddress(id) {
  return (
    (await db.delete(addresses).where(eq(addresses.id, id)).returning())[0] ??
    null
  );
}
export async function getCarts() {
  return await db.select().from(carts);
}
export async function getCart(id) {
  return (
    (await db.select().from(carts).where(eq(carts.id, id)).limit(1))[0] ?? null
  );
}
export async function createCart(data) {
  return (await db.insert(carts).values(data).returning())[0];
}
export async function updateCart(id, data) {
  return (
    (await db.update(carts).set(data).where(eq(carts.id, id)).returning())[0] ??
    null
  );
}
export async function deleteCart(id) {
  return (
    (await db.delete(carts).where(eq(carts.id, id)).returning())[0] ?? null
  );
}
export async function getCartItems() {
  return await db.select().from(cartItems);
}
export async function getCartItem(id) {
  return (
    (
      await db.select().from(cartItems).where(eq(cartItems.id, id)).limit(1)
    )[0] ?? null
  );
}
export async function createCartItem(data) {
  return (await db.insert(cartItems).values(data).returning())[0];
}
export async function updateCartItem(id, data) {
  return (
    (
      await db
        .update(cartItems)
        .set(data)
        .where(eq(cartItems.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteCartItem(id) {
  return (
    (await db.delete(cartItems).where(eq(cartItems.id, id)).returning())[0] ??
    null
  );
}
