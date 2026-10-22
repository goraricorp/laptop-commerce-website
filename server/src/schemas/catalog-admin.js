import { z } from 'zod'
const text = (max = 255) => z.string().trim().min(1).max(max)
const nullableId = z.uuid().nullable().optional()
const url = z
  .url()
  .max(4096)
  .refine((value) => /^https?:\/\//.test(value), 'Chỉ nhận URL HTTP/HTTPS.')
  .nullable()
  .optional()
const money = z
  .union([z.number(), z.string().regex(/^\d+(?:\.\d{1,2})?$/)])
  .refine(
    (value) =>
      Number.isFinite(Number(value)) &&
      Number(value) >= 0 &&
      Number(value) <= 999999999999.99,
    'Giá không hợp lệ.',
  )
export const catalogInputs = {
  campaigns: z
    .object({
      title: text(),
      description: z.string().max(20000).nullable().optional(),
      imageUrl: url.unwrap().unwrap(),
      productId: nullableId,
      promotionId: nullableId,
      startsAt: z.iso
        .datetime({ offset: true })
        .transform((value) => new Date(value)),
      endsAt: z.iso
        .datetime({ offset: true })
        .transform((value) => new Date(value)),
      isActive: z.boolean().optional(),
      position: z.number().int().nonnegative().optional(),
    })
    .strict(),
  categories: z
    .object({
      name: text(),
      slug: text(),
      parentId: nullableId,
      description: z.string().max(20000).nullable().optional(),
      imageUrl: url,
      position: z.number().int().nonnegative().optional(),
      isActive: z.boolean().optional(),
    })
    .strict(),
  brands: z
    .object({
      name: text(),
      slug: text(),
      logoUrl: url,
      isActive: z.boolean().optional(),
    })
    .strict(),
  products: z
    .object({
      expectedVersion:z.number().int().nonnegative().optional(),
      name: text(),
      slug: text(),
      categoryId: nullableId,
      brandId: nullableId,
      summary: z.string().max(20000).nullable().optional(),
      status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
      productType: z
        .enum([
          'laptop',
          'component',
          'accessory',
          'monitor',
          'furniture',
          'gaming',
          'other',
        ])
        .optional(),
    })
    .strict(),
  'product-variants': z
    .object({
      productId: z.uuid(),
      sku: text(100),
      name: text(),
      barcode: text(100).nullable().optional(),
      price: money,
      compareAtPrice: money.nullable().optional(),
      costPrice: money.nullable().optional(),
      status: z
        .enum(['active', 'inactive', 'out_of_stock', 'discontinued'])
        .optional(),
      weightGrams: z.number().int().nonnegative().nullable().optional(),
    })
    .strict(),
  attributes: z
    .object({
      name: text(100),
      code: text(100),
      displayType: z
        .enum(['text', 'color', 'number', 'boolean', 'select'])
        .optional(),
      isFilterable: z.boolean().optional(),
      position: z.number().int().nonnegative().optional(),
    })
    .strict(),
  'attribute-values': z
    .object({
      attributeId: z.uuid(),
      value: text(),
      code: text(100).nullable().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      position: z.number().int().nonnegative().optional(),
    })
    .strict(),
  'variant-attribute-values': z
    .object({ variantId: z.uuid(), attributeValueId: z.uuid() })
    .strict(),
  'product-media': z
    .object({
      productId: z.uuid(),
      variantId: nullableId,
      url: url.unwrap().unwrap(),
      mediaType: z.enum(['image', 'video']).optional(),
      alt: z.string().max(255).nullable().optional(),
      position: z.number().int().nonnegative().optional(),
      isPrimary: z.boolean().optional(),
    })
    .strict(),
  'product-content-sections': z
    .object({
      format: z.enum(['plain', 'html']).optional(),
      productId: z.uuid(),
      title: z.string().max(255).nullable().optional(),
      content: z.string().max(200000).nullable().optional(),
      imageUrl: url,
      position: z.number().int().nonnegative().optional(),
    })
    .strict(),
}
export function catalogInput(resource, value, update = false) {
  const schema = update
    ? catalogInputs[resource]
        .partial()
        .refine(
          (value) => Object.keys(value).length > 0,
          'Cần ít nhất một trường.',
        )
    : catalogInputs[resource]
  return schema.parse(value)
}
export const catalogQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    productId: z.uuid().optional(),
    variantId: z.uuid().optional(),
    attributeId: z.uuid().optional(),
  })
  .strict()
