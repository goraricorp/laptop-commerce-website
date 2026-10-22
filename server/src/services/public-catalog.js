import { and, eq, exists, isNull, or, sql, asc } from 'drizzle-orm'
import { db } from '../database/index.js'
import {
  attributes,
  attributeValues,
  brands,
  categories,
  products,
  productVariants,
  productMedia,
  productContentSections,
  variantAttributeValues,
} from '../database/schema.js'
import { cleanContent } from '../lib/catalog/content.js'
import { productTypeForCategory } from '../lib/catalog/product-type.js'

const pick = (table, names) =>
  Object.fromEntries(names.map((name) => [name, table[name]]))
const productColumns = pick(products, [
  'id',
  'categoryId',
  'brandId',
  'name',
  'slug',
  'summary',
  'status',
  'createdAt',
  'updatedAt',
])
const variantColumns = pick(productVariants, [
  'id',
  'productId',
  'sku',
  'name',
  'price',
  'compareAtPrice',
  'status',
  'weightGrams',
  'createdAt',
  'updatedAt',
])
export const publicCatalog = {
  categories: [
    categories,
    pick(categories, [
      'id',
      'parentId',
      'name',
      'slug',
      'description',
      'imageUrl',
      'position',
      'isActive',
      'createdAt',
      'updatedAt',
    ]),
  ],
  brands: [
    brands,
    pick(brands, [
      'id',
      'name',
      'slug',
      'logoUrl',
      'isActive',
      'createdAt',
      'updatedAt',
    ]),
  ],
  products: [products, productColumns],
  'product-variants': [productVariants, variantColumns],
  'product-media': [
    productMedia,
    pick(productMedia, [
      'id',
      'productId',
      'variantId',
      'url',
      'mediaType',
      'alt',
      'position',
      'isPrimary',
      'createdAt',
    ]),
  ],
  'product-content-sections': [
    productContentSections,
    pick(productContentSections, [
      'id',
      'productId',
      'title',
      'content',
      'format',
      'imageUrl',
      'position',
    ]),
  ],
  attributes: [
    attributes,
    pick(attributes, [
      'id',
      'name',
      'code',
      'displayType',
      'isFilterable',
      'position',
    ]),
  ],
  'attribute-values': [
    attributeValues,
    pick(attributeValues, ['id', 'attributeId', 'value', 'code', 'position']),
  ],
  'variant-attribute-values': [
    variantAttributeValues,
    pick(variantAttributeValues, ['variantId', 'attributeValueId']),
  ],
}
// Reject inactive ancestry and legacy cycles without unbounded recursion.
export const categoryVisible = (
  categoryId,
) => sql`not exists (with recursive lineage as (
  select root.id,root.parent_id,root.is_active,array[root.id] as path,false as cycle from category root where root.id = ${categoryId}
  union all select c.id,c.parent_id,c.is_active,l.path||c.id,c.id=any(l.path) from category c join lineage l on c.id=l.parent_id where not l.cycle
) select 1 from lineage where not is_active or cycle)`
export function productVisible() {
  return and(
    eq(products.status, 'active'),
    categoryVisible(products.categoryId),
    or(
      isNull(products.brandId),
      exists(
        db
          .select({ id: brands.id })
          .from(brands)
          .where(
            and(eq(brands.id, products.brandId), eq(brands.isActive, true)),
          ),
      ),
    ),
  )
}
const parentVisible = (productId) =>
  exists(
    db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), productVisible())),
  )
const variantVisible = (variantId, productId) =>
  exists(
    db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.status, 'active'),
          productId ? eq(productVariants.productId, productId) : undefined,
          parentVisible(productVariants.productId),
        ),
      ),
  )
export function visibility(resource) {
  if (resource === 'products') return productVisible()
  if (resource === 'categories')
    return and(eq(categories.isActive, true), categoryVisible(categories.id))
  if (resource === 'brands') return eq(brands.isActive, true)
  if (resource === 'product-variants')
    return and(
      eq(productVariants.status, 'active'),
      parentVisible(productVariants.productId),
    )
  if (resource === 'product-media')
    return and(
      parentVisible(productMedia.productId),
      or(
        isNull(productMedia.variantId),
        variantVisible(productMedia.variantId, productMedia.productId),
      ),
    )
  if (resource === 'product-content-sections')
    return parentVisible(productContentSections.productId)
  if (resource === 'variant-attribute-values')
    return variantVisible(variantAttributeValues.variantId)
  if (resource === 'attribute-values')
    return exists(
      db
        .select({ id: variantAttributeValues.attributeValueId })
        .from(variantAttributeValues)
        .where(
          and(
            eq(variantAttributeValues.attributeValueId, attributeValues.id),
            variantVisible(variantAttributeValues.variantId),
          ),
        ),
    )
  if (resource === 'attributes')
    return exists(
      db
        .select({ id: attributeValues.id })
        .from(attributeValues)
        .where(
          and(
            eq(attributeValues.attributeId, attributes.id),
            visibility('attribute-values'),
          ),
        ),
    )
}
export async function readPublicCatalog(
  resource,
  { page = 1, limit = 20, productId, variantId, attributeId } = {},
  ids,
) {
  const [table, columns] = publicCatalog[resource]
  const conditions = [visibility(resource)]
  if (ids)
    for (const [name, id] of Object.entries(ids))
      conditions.push(eq(table[name], id))
  for (const [name, value] of Object.entries({
    productId,
    variantId,
    attributeId,
  }))
    if (value) {
      if (!table[name]) return ids ? null : { items: [], total: 0, page, limit }
      conditions.push(eq(table[name], value))
    }
  const where = and(...conditions)
  const rows = await db
    .select(columns)
    .from(table)
    .where(where)
    .orderBy(
      ...(table.id
        ? [asc(table.id)]
        : [asc(table.variantId), asc(table.attributeValueId)]),
    )
    .limit(ids ? 1 : limit)
    .offset(ids ? 0 : (page - 1) * limit)
  if (resource === 'products' && rows.length) {
    const publicCategories = await db
      .select({
        id: categories.id,
        parentId: categories.parentId,
        slug: categories.slug,
      })
      .from(categories)
      .where(visibility('categories'))
    for (const row of rows)
      row.productType = productTypeForCategory(row.categoryId, publicCategories)
  }
  if (resource === 'product-content-sections')
    for (const row of rows) Object.assign(row, cleanContent(row))
  if (ids) return rows[0] ?? null
  const [count] = await db
    .select({ total: sql`count(*)::int` })
    .from(table)
    .where(where)
  return { items: rows, total: count.total, page, limit }
}
