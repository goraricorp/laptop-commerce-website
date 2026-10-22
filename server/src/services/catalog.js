import { mutateWithAssets, queueAssetCleanup } from "./storage.js";

import { and, eq } from "drizzle-orm";

import { productTypeForCategory } from "../lib/catalog/product-type.js";
import { db } from "../database/index.js";
import {
  attributeValues,
  attributes,
  brands,
  categories,
  productContentSections,
  productMedia,
  products,
  productVariants,
  variantAttributeValues,
} from "../database/schema.js";

export async function getCategories() {
  return await db.select().from(categories);
}
export async function getCategory(id) {
  return (
    (
      await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    )[0] ?? null
  );
}
export async function createCategory(data) {
  return mutateWithAssets(categories, "create", null, data);
}
export async function updateCategory(id, data) {
  return mutateWithAssets(categories, "update", id, data);
}
export async function deleteCategory(id) {
  return mutateWithAssets(categories, "delete", id);
}

export async function getBrands() {
  return await db.select().from(brands);
}
export async function getBrand(id) {
  return (
    (await db.select().from(brands).where(eq(brands.id, id)).limit(1))[0] ??
    null
  );
}
export async function createBrand(data) {
  return mutateWithAssets(brands, "create", null, data);
}
export async function updateBrand(id, data) {
  return mutateWithAssets(brands, "update", id, data);
}
export async function deleteBrand(id) {
  return mutateWithAssets(brands, "delete", id);
}

export async function getProducts() {
  const rows = await db.select().from(products);
  const categoryRows = await db.select().from(categories);
  return rows.map((row) => ({
    ...row,
    productType: productTypeForCategory(row.categoryId, categoryRows),
  }));
}
export async function getProduct(id) {
  const row = (
    await db.select().from(products).where(eq(products.id, id)).limit(1)
  )[0];
  if (!row) return null;
  return {
    ...row,
    productType: productTypeForCategory(
      row.categoryId,
      await db.select().from(categories),
    ),
  };
}
export async function createProduct(data) {
  const safe = { ...data };
  delete safe.productType;
  const row = (await db.insert(products).values(safe).returning())[0];
  return getProduct(row.id);
}
export async function updateProduct(id, data) {
  const safe = { ...data };
  delete safe.productType;
  const row = (
    await db.update(products).set(safe).where(eq(products.id, id)).returning()
  )[0];
  return row ? getProduct(id) : null;
}
export async function deleteProduct(id) {
  const previous = await getProduct(id);
  const images = await db
    .select({ url: productMedia.url })
    .from(productMedia)
    .where(eq(productMedia.productId, id));
  const content = await db
    .select({ url: productContentSections.imageUrl })
    .from(productContentSections)
    .where(eq(productContentSections.productId, id));
  const row =
    (await db.delete(products).where(eq(products.id, id)).returning())[0] ??
    null;
  try {
    await queueAssetCleanup(
      [...images, ...content].map((item) => item.url).filter(Boolean),
    );
  } catch {
    /* periodic sweep retries */
  }
  return row ? previous : null;
}

export async function getProductVariants() {
  return await db.select().from(productVariants);
}
export async function getProductVariant(id) {
  return (
    (
      await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createProductVariant(data) {
  return (await db.insert(productVariants).values(data).returning())[0];
}
export async function updateProductVariant(id, data) {
  return (
    (
      await db
        .update(productVariants)
        .set(data)
        .where(eq(productVariants.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteProductVariant(id) {
  const media = await db
    .select({ url: productMedia.url })
    .from(productMedia)
    .where(eq(productMedia.variantId, id));
  const row =
    (
      await db
        .delete(productVariants)
        .where(eq(productVariants.id, id))
        .returning()
    )[0] ?? null;
  try {
    await queueAssetCleanup(media.map((item) => item.url));
  } catch {
    /* periodic sweep retries */
  }
  return row;
}

export async function getAttributes() {
  return await db.select().from(attributes);
}
export async function getAttribute(id) {
  return (
    (
      await db.select().from(attributes).where(eq(attributes.id, id)).limit(1)
    )[0] ?? null
  );
}
export async function createAttribute(data) {
  return (await db.insert(attributes).values(data).returning())[0];
}
export async function updateAttribute(id, data) {
  return (
    (
      await db
        .update(attributes)
        .set(data)
        .where(eq(attributes.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteAttribute(id) {
  return (
    (await db.delete(attributes).where(eq(attributes.id, id)).returning())[0] ??
    null
  );
}

export async function getAttributeValues() {
  return await db.select().from(attributeValues);
}
export async function getAttributeValue(id) {
  return (
    (
      await db
        .select()
        .from(attributeValues)
        .where(eq(attributeValues.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createAttributeValue(data) {
  return (await db.insert(attributeValues).values(data).returning())[0];
}
export async function updateAttributeValue(id, data) {
  return (
    (
      await db
        .update(attributeValues)
        .set(data)
        .where(eq(attributeValues.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteAttributeValue(id) {
  return (
    (
      await db
        .delete(attributeValues)
        .where(eq(attributeValues.id, id))
        .returning()
    )[0] ?? null
  );
}

export async function getVariantAttributeValues() {
  return await db.select().from(variantAttributeValues);
}
export async function getVariantAttributeValue(variantId, attributeValueId) {
  return (
    (
      await db
        .select()
        .from(variantAttributeValues)
        .where(
          and(
            eq(variantAttributeValues.variantId, variantId),
            eq(variantAttributeValues.attributeValueId, attributeValueId),
          ),
        )
        .limit(1)
    )[0] ?? null
  );
}
export async function createVariantAttributeValue(data) {
  return (await db.insert(variantAttributeValues).values(data).returning())[0];
}
export async function updateVariantAttributeValue(
  variantId,
  attributeValueId,
  data,
) {
  return (
    (
      await db
        .update(variantAttributeValues)
        .set(data)
        .where(
          and(
            eq(variantAttributeValues.variantId, variantId),
            eq(variantAttributeValues.attributeValueId, attributeValueId),
          ),
        )
        .returning()
    )[0] ?? null
  );
}
export async function deleteVariantAttributeValue(variantId, attributeValueId) {
  return (
    (
      await db
        .delete(variantAttributeValues)
        .where(
          and(
            eq(variantAttributeValues.variantId, variantId),
            eq(variantAttributeValues.attributeValueId, attributeValueId),
          ),
        )
        .returning()
    )[0] ?? null
  );
}

export async function getProductMedia() {
  return await db.select().from(productMedia);
}
export async function getProductMedium(id) {
  return (
    (
      await db
        .select()
        .from(productMedia)
        .where(eq(productMedia.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createProductMedium(data) {
  return mutateWithAssets(productMedia, "create", null, data);
}
export async function updateProductMedium(id, data) {
  return mutateWithAssets(productMedia, "update", id, data);
}
export async function deleteProductMedium(id) {
  return mutateWithAssets(productMedia, "delete", id);
}

export async function getProductContentSections() {
  return await db.select().from(productContentSections);
}
export async function getProductContentSection(id) {
  return (
    (
      await db
        .select()
        .from(productContentSections)
        .where(eq(productContentSections.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createProductContentSection(data) {
  return mutateWithAssets(productContentSections, "create", null, data);
}
export async function updateProductContentSection(id, data) {
  return mutateWithAssets(productContentSections, "update", id, data);
}
export async function deleteProductContentSection(id) {
  return mutateWithAssets(productContentSections, "delete", id);
}
