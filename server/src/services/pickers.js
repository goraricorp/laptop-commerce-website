import { productTypeForCategory } from "../lib/catalog/product-type.js";
import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/index.js";
import {
  addresses,
  attributes,
  attributeValues,
  brands,
  categories,
  conversations,
  inventoryLocations,
  orderItems,
  orders,
  products,
  productVariants,
  promotions,
  promotionCodes,
  carts,
  messages,
  user,
} from "../database/schema.js";
import { domainError as error } from "./account-state.js";
const tables = {
  categories,
  brands,
  products,
  "product-variants": productVariants,
  attributes,
  "attribute-values": attributeValues,
  "inventory-locations": inventoryLocations,
  promotions,
  "promotion-codes": promotionCodes,
  users: user,
  orders,
  "order-items": orderItems,
  addresses,
  carts,
  conversations,
  messages,
};
export async function picker(resource, raw = {}, selectedId) {
  const {
    q,
    page,
    limit,
    productId,
    attributeId,
    staffOnly,
    masterEligible,
    excludeId,
    ids,
  } = z
    .object({
      q: z.string().trim().max(255).default(""),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      productId: z.uuid().optional(),
      attributeId: z.uuid().optional(),
      staffOnly: z.enum(["true", "false"]).optional(),
      masterEligible: z.enum(["true", "false"]).optional(),
      excludeId: z.uuid().optional(),
      ids: z
        .string()
        .transform((value) => value.split(","))
        .pipe(z.array(z.uuid()).min(1).max(50))
        .optional(),
    })
    .strict()
    .parse(raw);
  const table = tables[resource];
  if (!table) throw error("Không có nguồn lựa chọn.", 404);
  if (["conversations", "messages"].includes(resource))
    throw error("Sử dụng luồng phân công hỗ trợ.", 403);
  const label =
    resource === "attribute-values"
      ? sql`(select a.name from attribute a where a.id=${table.attributeId}) || ' · ' || ${table.value}`
      : resource === "carts"
        ? sql`coalesce((select u.name from "user" u where u.id=${table.userId}),'Khách') || ' · ' || ${table.status}::text || ' · ' || ${table.createdAt}::text`
        : (table.name ??
          table.value ??
          table.code ??
          table.subject ??
          table.productName ??
          table.recipientName ??
          sql`${table.id}::text`);
  const where = and(
    resource === "inventory-locations" && !selectedId && !ids
      ? eq(table.isActive, true)
      : undefined,
    excludeId ? sql`${table.id}<>${excludeId}::uuid` : undefined,
    masterEligible === "true" && table.role
      ? sql`${table.role} in ('administrator','master') and ${table.emailVerified}=true and coalesce(${table.banned},false)=false`
      : undefined,
    selectedId ? eq(table.id, selectedId) : undefined,
    ids ? inArray(table.id, ids) : undefined,
    q
      ? or(
          ilike(label, `%${q}%`),
          table.sku ? ilike(table.sku, `%${q}%`) : undefined,
          table.email ? ilike(table.email, `%${q}%`) : undefined,
        )
      : undefined,
    productId && table.productId ? eq(table.productId, productId) : undefined,
    attributeId && table.attributeId
      ? eq(table.attributeId, attributeId)
      : undefined,
    table.anonymizedAt ? sql`${table.anonymizedAt} is null` : undefined,
    staffOnly === "true" && table.role
      ? sql`${table.role} in ('moderator','administrator','master') and coalesce(${table.banned},false)=false`
      : undefined,
  );
  const items = await db
    .select({
      id: table.id,
      label,
      ...(table.sku ? { sku: table.sku } : {}),
      ...(table.logoUrl ? { logoUrl: table.logoUrl } : {}),
      ...(table.role ? { role: table.role } : {}),
      ...(table.email ? { email: table.email } : {}),
      ...(table.isActive ? { isActive: table.isActive } : {}),
    })
    .from(table)
    .where(where)
    .orderBy(asc(label), asc(table.id))
    .limit(selectedId ? 1 : ids ? ids.length : limit)
    .offset(selectedId || ids ? 0 : (page - 1) * limit);
  const [{ total }] = await db
    .select({ total: sql`count(*)::int` })
    .from(table)
    .where(where);
  if (resource === "categories") {
    const all = await db.select().from(categories);
    for (const item of items)
      item.productType = productTypeForCategory(item.id, all);
  }
  return { items, total, page, limit };
}
