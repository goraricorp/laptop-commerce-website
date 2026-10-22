import { sql, and, eq, asc } from 'drizzle-orm'
import { db } from '../database/index.js'
import {
  categories,
  productContentSections,
  productMedia,
  productVariants,
  brands,
} from '../database/schema.js'
import {
  productVisible,
  visibility,
  publicCatalog,
  readPublicCatalog,
} from './public-catalog.js'
import { productTypeForCategory } from '../lib/catalog/product-type.js'
import { cleanContent } from '../lib/catalog/content.js'

// Only hard-coded identifiers enter raw SQL. All request values remain parameters.
const jsonColumns = (alias, fields) =>
  sql`jsonb_build_object(${sql.join(
    fields.map(
      ([key, column]) => sql`${key}::text, ${sql.raw(`${alias}.${column}`)}`,
    ),
    sql`, `,
  )})`
const productJSON = jsonColumns('product', [
  ['id', 'id'],
  ['categoryId', 'category_id'],
  ['brandId', 'brand_id'],
  ['name', 'name'],
  ['slug', 'slug'],
  ['summary', 'summary'],
  ['status', 'status'],
  ['createdAt', 'created_at'],
  ['updatedAt', 'updated_at'],
])
const variantJSON = jsonColumns('v', [
  ['id', 'id'],
  ['productId', 'product_id'],
  ['sku', 'sku'],
  ['name', 'name'],
  ['price', 'price'],
  ['compareAtPrice', 'compare_at_price'],
  ['status', 'status'],
  ['weightGrams', 'weight_grams'],
  ['createdAt', 'created_at'],
  ['updatedAt', 'updated_at'],
])
const brandJSON = sql`(select jsonb_build_object('id',b.id,'name',b.name,'slug',b.slug) from brand b where b.id=product.brand_id and b.is_active)`
const mediaJSON = sql`(select jsonb_build_object('id',m.id,'url',m.url,'alt',m.alt,'variantId',m.variant_id) from product_media m where m.product_id=product.id and (m.variant_id=v.id or m.variant_id is null) and m.media_type='image' order by (m.variant_id=v.id) desc nulls last,m.is_primary desc,m.position,m.id limit 1)`
const available = sql`exists(select 1 from inventory_balance ib join inventory_location il on il.id=ib.location_id and il.is_active where ib.variant_id=v.id and ib.quantity_on_hand>ib.quantity_reserved)`
function baseConditions(query) {
  const parts = [productVisible(), sql`v.status='active'`, sql`v.price>0`]
  if (query.categoryId || (query.type && query.type !== 'all')) {
    const root = query.categoryId
      ? sql`c.id=${query.categoryId}::uuid`
      : sql`c.slug=${query.type}`
    parts.push(
      sql`product.category_id in (with recursive tree as (select c.id from category c where ${root} union select c.id from category c join tree t on c.parent_id=t.id) select id from tree)`,
    )
  }
  if (query.q) {
    const pattern = `%${query.q.replace(/[\\%_]/g, '\\$&')}%`
    parts.push(
      sql`(product.name ilike ${pattern} or coalesce(product.summary,'') ilike ${pattern} or v.name ilike ${pattern} or v.sku ilike ${pattern} or exists(select 1 from brand b where b.id=product.brand_id and b.name ilike ${pattern}) or exists(select 1 from variant_attribute_value va join attribute_value av on av.id=va.attribute_value_id where va.variant_id=v.id and av.value ilike ${pattern}))`,
    )
  }
  return parts
}
function matchingConditions(query) {
  const parts = baseConditions(query)
  if (query.brandId?.length)
    parts.push(
      sql`product.brand_id in (${sql.join(
        query.brandId.map((id) => sql`${id}::uuid`),
        sql`,`,
      )})`,
    )
  if (query.brand)
    parts.push(
      sql`exists(select 1 from brand b where b.id=product.brand_id and (b.name=${query.brand} or b.slug=${query.brand}))`,
    )
  if (query.minPrice !== undefined) parts.push(sql`v.price>=${query.minPrice}`)
  if (query.maxPrice !== undefined) parts.push(sql`v.price<=${query.maxPrice}`)
  for (const [code, values] of Object.entries(query.attributes ?? {})) {
    // One EXISTS per attribute group, all correlated to the SAME v.id.
    parts.push(
      sql`exists(select 1 from variant_attribute_value va join attribute_value av on av.id=va.attribute_value_id join attribute a on a.id=av.attribute_id where va.variant_id=v.id and a.is_filterable and (a.code=${code} or a.id::text=${code}) and av.id in (${sql.join(
        values.map((id) => sql`${id}::uuid`),
        sql`,`,
      )}))`,
    )
  }
  return and(...parts)
}
const from = sql`from product join product_variant v on v.product_id=product.id`
async function decorate(items) {
  if (!items.length) return items
  const all = await db
    .select({
      id: categories.id,
      parentId: categories.parentId,
      slug: categories.slug,
    })
    .from(categories)
    .where(visibility('categories'))
  return items.map((item) => ({
    ...item,
    productType: productTypeForCategory(item.categoryId, all),
  }))
}
export async function searchCatalog(query) {
  const { page = 1, limit = 24, sort = 'newest' } = query
  const matching = sql`select product.id,product.name,product.created_at,v.price,${productJSON} || jsonb_build_object('variant',${variantJSON},'brand',${brandJSON},'media',${mediaJSON},'available',${available}) as item,row_number() over(partition by product.id order by v.price,v.id) as rank ${from} where ${matchingConditions(query)}`
  const order = {
    newest: sql`created_at desc,id`,
    name: sql`name,id`,
    'price-asc': sql`price,id`,
    'price-desc': sql`price desc,id`,
  }[sort]
  // One statement snapshot: totals and page cannot disagree during concurrent writes.
  const {
    rows: [result],
  } = await db.execute(
    sql`with matching as (${matching}), selected as (select * from matching where rank=1), page as (select * from selected order by ${order} limit ${limit} offset ${(page - 1) * limit}) select (select count(*)::int from selected) as total,coalesce((select jsonb_agg(item order by ${order}) from page),'[]') as items`,
  )
  // Facets describe the current search/category scope, before selected facet/price constraints.
  const {
    rows: [facets],
  } =
    await db.execute(sql`with scope as (select product.id,product.brand_id,product.category_id,v.id as variant_id ${from} where ${and(...baseConditions(query))}) select
    coalesce((select jsonb_agg(x order by x->>'name') from (select distinct jsonb_build_object('id',b.id,'name',b.name) x from scope s join brand b on b.id=s.brand_id) t),'[]') as brands,
    coalesce((select jsonb_agg(x order by x->>'name') from (select distinct jsonb_build_object('id',c.id,'name',c.name) x from scope s join category c on c.id=s.category_id) t),'[]') as categories,
    coalesce((select jsonb_agg(x order by position,id) from (select a.id,a.position,jsonb_build_object('id',a.id,'code',a.code,'name',a.name,'values',jsonb_agg(distinct jsonb_build_object('id',av.id,'value',av.value))) x from scope s join variant_attribute_value va on va.variant_id=s.variant_id join attribute_value av on av.id=va.attribute_value_id join attribute a on a.id=av.attribute_id and a.is_filterable group by a.id) t),'[]') as attributes`)
  return {
    items: await decorate(result.items),
    total: result.total,
    page,
    limit,
    facets,
  }
}
export async function productDetails(id) {
  const product = await readPublicCatalog('products', {}, { id })
  if (!product) return null
  const variants = await db
    .select({
      ...publicCatalog['product-variants'][1],
      available: sql`exists(select 1 from inventory_balance ib join inventory_location il on il.id=ib.location_id and il.is_active where ib.variant_id=${sql.raw('"product_variant"."id"')} and ib.quantity_on_hand>ib.quantity_reserved)`,
      attributes: sql`coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'code',a.code,'name',a.name,'value',av.value) order by a.position,a.id,av.position,av.id) from variant_attribute_value va join attribute_value av on av.id=va.attribute_value_id join attribute a on a.id=av.attribute_id where va.variant_id=${sql.raw('"product_variant"."id"')}),'[]')`,
    })
    .from(productVariants)
    .where(
      and(eq(productVariants.productId, id), visibility('product-variants')),
    )
    .orderBy(asc(productVariants.price), asc(productVariants.id))
  const media = await db
    .select(publicCatalog['product-media'][1])
    .from(productMedia)
    .where(and(eq(productMedia.productId, id), visibility('product-media')))
    .orderBy(asc(productMedia.position), asc(productMedia.id))
  const content = await db
    .select()
    .from(productContentSections)
    .where(eq(productContentSections.productId, id))
    .orderBy(
      asc(productContentSections.position),
      asc(productContentSections.id),
    )
  const [brand] = product.brandId
    ? await db
        .select(publicCatalog.brands[1])
        .from(brands)
        .where(and(eq(brands.id, product.brandId), visibility('brands')))
    : []
  return {
    product,
    brand: brand ?? null,
    variants,
    media,
    contentSections: content.map(cleanContent),
  }
}
export async function activeCampaigns() {
  const { rows } = await db.execute(
    sql`select c.id,c.title,c.description,c.image_url as "imageUrl",c.product_id as "productId",p.slug as "productSlug",coalesce(b.slug,'store') as "brandSlug",case when pr.id is not null then jsonb_build_object('name',pr.name,'discountType',pr.discount_type,'discountValue',pr.discount_value,'minimumOrderValue',pr.minimum_order_value,'maximumDiscount',pr.maximum_discount) else null end as promotion from storefront_campaign c left join product p on p.id=c.product_id left join brand b on b.id=p.brand_id left join promotion pr on pr.id=c.promotion_id and pr.is_active and pr.starts_at<=now() and pr.ends_at>now() where c.is_active and c.starts_at<=now() and c.ends_at>now() and (c.promotion_id is null or pr.id is not null) and (c.product_id is null or exists(select 1 from product where product.id=c.product_id and ${productVisible()})) order by c.position,c.id`,
  )
  return rows
}
export async function bestSellers() {
  // Existing legacy returns are whole orders (returned). Partial returns integrate in Phase 4.
  const { rows } = await db.execute(
    sql`with sold as (select v.product_id,sum(i.quantity-coalesce((select sum(ri.accepted_quantity) from sales_return_item ri join sales_return r on r.id=ri.return_id where ri.order_item_id=i.id and r.status in ('inspected','completed')),0))::int as units from sales_order_item i join sales_order o on o.id=i.order_id join product_variant v on v.id=i.variant_id where o.order_status='completed' and o.payment_status in ('paid','partially_refunded','refunded') and coalesce((select f.delivered_at from order_fulfillment f where f.order_id=o.id),(select max(h.created_at) from order_status_history h where h.order_id=o.id and h.status='completed'),o.updated_at)>=now()-interval '7 days' group by v.product_id), ranked as (select product.id,sold.units,v.price,${productJSON} || jsonb_build_object('variant',${variantJSON},'brand',${brandJSON},'media',${mediaJSON},'available',${available},'soldUnits',sold.units) item,row_number() over(partition by product.id order by v.price,v.id) rank from product join sold on sold.product_id=product.id join product_variant v on v.product_id=product.id where ${productVisible()} and v.status='active' and v.price>0) select item from ranked where rank=1 and units>0 order by units desc,id limit 8`,
  )
  return { items: await decorate(rows.map((row) => row.item)) }
}
