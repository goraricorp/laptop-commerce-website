import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../database/index.js'
import {
  uploadAssets,
  campaigns,
  promotions,
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
import { attachAssets, queueAssetCleanup } from './storage.js'
import { cleanContent } from '../lib/catalog/content.js'
import { productTypeForCategory } from '../lib/catalog/product-type.js'
export const adminTables = {
  campaigns,
  categories,
  brands,
  products,
  attributes,
  'attribute-values': attributeValues,
  'product-variants': productVariants,
  'product-media': productMedia,
  'product-content-sections': productContentSections,
  'variant-attribute-values': variantAttributeValues,
}
const invalid = (field, message) => {
  throw Object.assign(new Error(message), {
    status: 400,
    issues: [{ code: 'custom', path: [field], message }],
  })
}
const keyWhere = (table, ids) =>
  and(...Object.entries(ids).map(([key, value]) => eq(table[key], value)))
const refs = {
  promotionId: promotions,
  parentId: categories,
  categoryId: categories,
  brandId: brands,
  productId: products,
  variantId: productVariants,
  attributeId: attributes,
  attributeValueId: attributeValues,
}
async function validateRelations(tx, resource, merged, ids) {
  if (
    resource === 'campaigns' &&
    !(new Date(merged.endsAt) > new Date(merged.startsAt))
  )
    invalid('endsAt', 'Ngày kết thúc phải sau ngày bắt đầu.')
  for (const [key, table] of Object.entries(refs))
    if (merged[key]) {
      if (
        !(
          await tx
            .select({ id: table.id })
            .from(table)
            .where(eq(table.id, merged[key]))
            .limit(1)
        )[0]
      )
        invalid(key, 'Bản ghi liên quan không tồn tại.')
    }
  if (resource === 'product-media' && merged.variantId) {
    const [variant] = await tx
      .select({ productId: productVariants.productId })
      .from(productVariants)
      .where(eq(productVariants.id, merged.variantId))
    if (variant.productId !== merged.productId)
      invalid('variantId', 'SKU không thuộc sản phẩm đã chọn.')
  }
  if (resource === 'categories') {
    let id = merged.parentId
    const visited = new Set(ids?.id ? [ids.id] : [])
    while (id) {
      if (visited.has(id)) invalid('parentId', 'Danh mục cha tạo chu trình.')
      visited.add(id)
      id = (
        await tx
          .select({ parentId: categories.parentId })
          .from(categories)
          .where(eq(categories.id, id))
      )[0]?.parentId
    }
  }
}
export async function readAdminCatalog(
  resource,
  { page = 1, limit = 20, productId, variantId, attributeId } = {},
  ids,
) {
  const table = adminTables[resource]
  const where = and(
    ids ? keyWhere(table, ids) : undefined,
    ...Object.entries({ productId, variantId, attributeId })
      .filter(([key, value]) => value && table[key])
      .map(([key, value]) => eq(table[key], value)),
  )
  const rows = await db
    .select()
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
    const all = await db.select().from(categories)
    const media = await db.selectDistinctOn([productMedia.productId], { productId: productMedia.productId, url: productMedia.url }).from(productMedia)
      .where(and(inArray(productMedia.productId, rows.map(row => row.id)), eq(productMedia.mediaType, 'image')))
      .orderBy(asc(productMedia.productId), desc(productMedia.isPrimary), asc(productMedia.position), asc(productMedia.id))
    const images = new Map()
    for (const item of media) if (!images.has(item.productId)) images.set(item.productId, item.url)
    for (const row of rows) {
      row.productType = productTypeForCategory(row.categoryId, all)
      row.imageUrl = images.get(row.id) ?? null
    }
  }
  if (ids) return rows[0] ?? null
  const [count] = await db
    .select({ total: sql`count(*)::int` })
    .from(table)
    .where(where)
  return { items: rows, page, limit, total: count.total }
}
export async function writeAdminCatalog(resource, action, ids, input = {}) {
  const table = adminTables[resource]
  const data = { ...input }
  const expectedVersion=data.expectedVersion;delete data.expectedVersion
  if (resource === 'products') delete data.productType
  const oldUrls = []
  const result = await db.transaction(async (tx) => {
    if (resource === 'categories')
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended('catalog-category-tree', 0))`,
      )
    let parentId=resource==='products'?ids?.id:input.productId
    if(['product-variants','product-media','product-content-sections'].includes(resource)&&ids) {
      const [item]=await tx.select().from(table).where(keyWhere(table,ids))
      if(item) {if(input.productId&&input.productId!==item.productId)invalid('productId','Không chuyển bản ghi sang sản phẩm khác.');parentId=item.productId}
    }
    if(resource==='variant-attribute-values') {
      const [variant]=await tx.select().from(productVariants).where(eq(productVariants.id,ids?.variantId??input.variantId))
      parentId=variant?.productId
    }
    if(parentId)await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`product:${parentId}`},0))`)
    const previous = ids
      ? (
          await tx
            .select()
            .from(table)
            .where(keyWhere(table, ids))
            .for('update')
        )[0]
      : null
    if (ids && !previous) return null
    if(resource==='products'&&action==='update'&&expectedVersion!==previous.version)throw Object.assign(new Error('Sản phẩm đã đổi hoặc thiếu phiên bản; dùng product editor.'),{status:409})
    if (action !== 'delete') {
      await validateRelations(tx, resource, { ...previous, ...data }, ids)
      if (resource === 'product-content-sections')
        data.content = cleanContent({ ...previous, ...data }).content
    }
    const imageFields = ['url', 'imageUrl', 'logoUrl'].filter(
      (field) => table[field],
    )
    for (const field of imageFields)
      if (previous?.[field]) oldUrls.push(previous[field])
    for(const field of imageFields)if(data[field]){
      const [asset]=await tx.select().from(uploadAssets).where(eq(uploadAssets.url,data[field]))
      if(asset?.purpose==='support')invalid(field,'Ảnh hỗ trợ riêng tư không được dùng trong catalog.')
    }
    if (action !== 'delete')
      await attachAssets(
        tx,
        imageFields.map((field) => data[field]).filter(Boolean),
      )
    if (
      action === 'delete' &&
      ['products', 'product-variants'].includes(resource)
    ) {
      const media = await tx
        .select({ url: productMedia.url })
        .from(productMedia)
        .where(
          eq(
            resource === 'products'
              ? productMedia.productId
              : productMedia.variantId,
            ids.id,
          ),
        )
      oldUrls.push(...media.map((row) => row.url))
      if (resource === 'products')
        oldUrls.push(
          ...(
            await tx
              .select({ url: productContentSections.imageUrl })
              .from(productContentSections)
              .where(eq(productContentSections.productId, ids.id))
          ).map((row) => row.url),
        )
    }
    let row
    if (action === 'create')
      [row] = await tx.insert(table).values(data).returning()
    else if (action === 'delete'&&['products','product-variants'].includes(resource))
      [row]=await tx.update(table).set({status:resource==='products'?'archived':'discontinued',updatedAt:new Date()}).where(keyWhere(table,ids)).returning()
    else if (action === 'delete')
      [row] = await tx.delete(table).where(keyWhere(table, ids)).returning()
    else
      [row] = await tx
        .update(table)
        .set({ ...data, ...(table.updatedAt ? { updatedAt: new Date() } : {}) })
        .where(keyWhere(table, ids))
        .returning()
    if(parentId) {
      const [parent]=await tx.update(products).set({version:sql`${products.version}+1`,updatedAt:new Date()}).where(eq(products.id,parentId)).returning()
      if(resource==='products')row=parent
    }
    if (resource === 'products')
      row.productType = productTypeForCategory(
        row.categoryId,
        await tx.select().from(categories),
      )
    return row
  })
  const retained = ['url', 'imageUrl', 'logoUrl'].map(
    (field) => result?.[field],
  )
  try {
    await queueAssetCleanup(
      oldUrls.filter(
        (url) => url && (action === 'delete' || !retained.includes(url)),
      ),
    )
  } catch {
    /* durable cleanup manifest retries */
  }
  return result
}
