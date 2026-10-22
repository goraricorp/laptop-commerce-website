import { z } from "zod";

import {
  dateTimeSchema,
  decimalSchema,
  nullableUuidSchema,
  resourceSchemas,
  uuidSchema,
} from "@/schemas/common";

export const productStatusSchema = z.enum([
  "draft",
  "active",
  "inactive",
  "archived",
]);
export const productTypeSchema = z.enum([
  "laptop",
  "component",
  "accessory",
  "monitor",
  "furniture",
  "gaming",
  "other",
]);
export const variantStatusSchema = z.enum([
  "active",
  "inactive",
  "out_of_stock",
  "discontinued",
]);
export const mediaTypeSchema = z.enum(["image", "video"]);
export const attributeDisplayTypeSchema = z.enum([
  "text",
  "color",
  "number",
  "boolean",
  "select",
]);

const timestamps = { createdAt: dateTimeSchema, updatedAt: dateTimeSchema };

export const categorySchema = z.object({
  id: uuidSchema,
  parentId: nullableUuidSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  position: z.number().int(),
  isActive: z.boolean(),
  ...timestamps,
});
export const categoryInputSchema = z.object({
  parentId: nullableUuidSchema.optional(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  imageUrl: z.url().nullable().optional(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const brandSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  isActive: z.boolean(),
  ...timestamps,
});
export const brandInputSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  logoUrl: z.url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const productSchema = z.object({
  id: uuidSchema,
  imageUrl: z.string().nullable().optional(),
  categoryId: nullableUuidSchema,
  brandId: nullableUuidSchema,
  name: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  status: productStatusSchema,
  productType: productTypeSchema,
  ...timestamps,
});
export const productInputSchema = z.object({
  categoryId: nullableUuidSchema.optional(),
  brandId: nullableUuidSchema.optional(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  summary: z.string().nullable().optional(),
  status: productStatusSchema.optional(),
  productType: productTypeSchema.optional(),
});

export const productVariantSchema = z.object({
  id: uuidSchema,
  productId: uuidSchema,
  sku: z.string(),
  name: z.string(),
  barcode: z.string().nullable(),
  price: decimalSchema,
  compareAtPrice: decimalSchema.nullable(),
  costPrice: decimalSchema.nullable(),
  status: variantStatusSchema,
  weightGrams: z.number().int().nullable(),
  ...timestamps,
});
export const productVariantInputSchema = z.object({
  productId: uuidSchema,
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  barcode: z.string().nullable().optional(),
  price: decimalSchema,
  compareAtPrice: decimalSchema.nullable().optional(),
  costPrice: decimalSchema.nullable().optional(),
  status: variantStatusSchema.optional(),
  weightGrams: z.number().int().nonnegative().nullable().optional(),
});

export const attributeSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  code: z.string(),
  displayType: attributeDisplayTypeSchema,
  isFilterable: z.boolean(),
  position: z.number().int(),
});
export const attributeInputSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  displayType: attributeDisplayTypeSchema.optional(),
  isFilterable: z.boolean().optional(),
  position: z.number().int().optional(),
});

export const attributeValueSchema = z.object({
  id: uuidSchema,
  attributeId: uuidSchema,
  value: z.string(),
  code: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  position: z.number().int(),
});
export const attributeValueInputSchema = z.object({
  attributeId: uuidSchema,
  value: z.string().trim().min(1),
  code: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  position: z.number().int().optional(),
});

export const variantAttributeValueSchema = z.object({
  variantId: uuidSchema,
  attributeValueId: uuidSchema,
});

export const productMediaSchema = z.object({
  id: uuidSchema,
  productId: uuidSchema,
  variantId: nullableUuidSchema,
  url: z.string(),
  mediaType: mediaTypeSchema,
  alt: z.string().nullable(),
  position: z.number().int(),
  isPrimary: z.boolean(),
  createdAt: dateTimeSchema,
});
export const productMediaInputSchema = z.object({
  productId: uuidSchema,
  variantId: nullableUuidSchema.optional(),
  url: z.url(),
  mediaType: mediaTypeSchema.optional(),
  alt: z.string().nullable().optional(),
  position: z.number().int().optional(),
  isPrimary: z.boolean().optional(),
});

export const productContentSectionSchema = z.object({
  id: uuidSchema,
  productId: uuidSchema,
  format: z.enum(["plain", "html"]).default("plain"),
  title: z.string().nullable(),
  content: z.string().nullable(),
  imageUrl: z.string().nullable(),
  position: z.number().int(),
});
export const productContentSectionInputSchema = z.object({
  productId: uuidSchema,
  format: z.enum(["plain", "html"]).optional(),
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  imageUrl: z.url().nullable().optional(),
  position: z.number().int().optional(),
});

const campaignInput = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  imageUrl: z.url(),
  productId: nullableUuidSchema.optional(),
  promotionId: nullableUuidSchema.optional(),
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  position: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
const campaignEntity = campaignInput.extend({ id: uuidSchema, ...timestamps });
export const catalogSchemas = {
  campaign: resourceSchemas(campaignEntity, campaignInput),
  category: resourceSchemas(categorySchema, categoryInputSchema),
  brand: resourceSchemas(brandSchema, brandInputSchema),
  product: resourceSchemas(productSchema, productInputSchema),
  "product-variant": resourceSchemas(
    productVariantSchema,
    productVariantInputSchema,
  ),
  attribute: resourceSchemas(attributeSchema, attributeInputSchema),
  "attribute-value": resourceSchemas(
    attributeValueSchema,
    attributeValueInputSchema,
  ),
  "variant-attribute-value": resourceSchemas(
    variantAttributeValueSchema,
    variantAttributeValueSchema,
  ),
  "product-media": resourceSchemas(productMediaSchema, productMediaInputSchema),
  "product-content-section": resourceSchemas(
    productContentSectionSchema,
    productContentSectionInputSchema,
  ),
};

// Public responses intentionally exclude internal accounting/metadata fields.
export const publicCatalogSchemas = {
  ...catalogSchemas,
  "product-variant": {
    ...catalogSchemas["product-variant"],
    entity: productVariantSchema.omit({ costPrice: true, barcode: true }),
  },
  "attribute-value": {
    ...catalogSchemas["attribute-value"],
    entity: attributeValueSchema.omit({ metadata: true }),
  },
};
