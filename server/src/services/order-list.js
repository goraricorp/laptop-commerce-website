import { sql, and } from 'drizzle-orm'
import { db } from '../database/index.js'
import { betterAuthSecret } from '../lib/utils/environment.js'
import { orderListInput, orderCursorCodec } from '../lib/orders/cursor.js'
const codec = orderCursorCodec(betterAuthSecret)
const stamp = (column) =>
  sql`to_char(${column} at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`
export async function listOrderPage(raw = {}, userId) {
  const query = orderListInput.parse(raw)
  const scope = userId ? `me:${userId}` : 'admin'
  const filter = codec.filter({
    scope,
    q: query.q,
    status: query.status,
    group: query.group,
    sort: query.sort,
    limit: query.limit,
  })
  const cursor = query.cursor ? codec.decode(query.cursor) : null
  if (
    cursor &&
    (cursor.scope !== scope ||
      cursor.filter !== filter ||
      (query.asOf && cursor.asOf !== query.asOf))
  )
    throw Object.assign(
      new Error('Cursor không khớp bộ lọc hoặc tài khoản; hãy làm mới.'),
      { status: 400 },
    )
  const asOf =
    cursor?.asOf ??
    query.asOf ??
    (
      await db.execute(
        sql`select ${stamp(sql`statement_timestamp()`)} as value`,
      )
    ).rows[0].value
  if (Date.parse(asOf) > Date.now() + 1000)
    throw Object.assign(new Error('Mốc danh sách không hợp lệ.'), {
      status: 400,
    })
  const base = [sql`o.created_at<=${asOf}::timestamptz`]
  if (userId) base.push(sql`o.user_id=${userId}::uuid`)
  if (query.status !== 'all') base.push(sql`o.order_status=${query.status}`)
  const awaiting = sql`(o.payment_status='paid' and o.order_status in ('confirmed','processing') and o.fulfillment_status<>'delivered')`
  if (query.group === 'processing')
    base.push(
      sql`o.order_status in ('pending','confirmed','processing') and not ${awaiting}`,
    )
  if (query.group === 'awaitingDelivery') base.push(awaiting)
  if (query.group === 'completed') base.push(sql`o.order_status='completed'`)
  if (query.group === 'cancelled')
    base.push(sql`o.order_status in ('cancelled','returned')`)
  if (query.q) {
    const pattern = '%' + query.q.replace(/[\\%_]/g, '\\$&') + '%'
    base.push(
      sql`(o.code ilike ${pattern} or exists(select 1 from sales_order_item i where i.order_id=o.id and (i.product_name ilike ${pattern} or i.sku ilike ${pattern})) ${userId ? sql`` : sql`or coalesce(u.name,'') ilike ${pattern} or coalesce(u.email,o.guest_email,'') ilike ${pattern}`})`,
    )
  }
  const next = cursor
    ? query.sort === 'newest'
      ? sql`(o.created_at,o.id)<(${cursor.at}::timestamptz,${cursor.id}::uuid)`
      : sql`(o.created_at,o.id)>(${cursor.at}::timestamptz,${cursor.id}::uuid)`
    : undefined
  const order =
    query.sort === 'newest'
      ? sql`o.created_at desc,o.id desc`
      : sql`o.created_at,o.id`
  const direction =
    query.sort === 'newest' ? sql`created_at desc,id desc` : sql`created_at,id`
  const item = sql`jsonb_build_object('id',o.id,'code',o.code,'userId',o.user_id,'guestEmail',o.guest_email,'subtotal',o.subtotal,'discountTotal',o.discount_total,'shippingTotal',o.shipping_total,'grandTotal',o.grand_total,'orderStatus',o.order_status,'paymentStatus',o.payment_status,'fulfillmentStatus',o.fulfillment_status,'note',o.note,'createdAt',o.created_at,'updatedAt',o.updated_at,'itemCount',coalesce((select sum(i.quantity) from sales_order_item i where i.order_id=o.id),0)) ${userId ? sql`` : sql`||jsonb_build_object('customerName',u.name,'customerEmail',coalesce(u.email,o.guest_email))`}`
  const {
    rows: [result],
  } = await db.execute(
    sql`with page as (select o.id,o.created_at,${stamp(sql`o.created_at`)} as cursor_at,${item} item from sales_order o left join "user" u on u.id=o.user_id where ${and(...base, next)} order by ${order} limit ${query.limit + 1}) select (select count(*)::int from sales_order o left join "user" u on u.id=o.user_id where ${and(...base)}) total,coalesce((select jsonb_agg(jsonb_build_object('item',item,'at',cursor_at) order by ${direction}) from page),'[]') rows`,
  )
  const hasMore = result.rows.length > query.limit,
    rows = result.rows.slice(0, query.limit),
    last = rows.at(-1)
  return {
    items: rows.map((row) => row.item),
    total: result.total,
    limit: query.limit,
    asOf,
    hasMore,
    nextCursor: hasMore
      ? codec.encode({
          v: 1,
          at: last.at,
          id: last.item.id,
          asOf,
          scope,
          filter,
        })
      : null,
  }
}
