// Read-only preflight. This script never applies migrations or repairs business data.
import dotenv from 'dotenv'
import pg from 'pg'
import process from 'node:process'
dotenv.config({ path: '.env.local', quiet: true, override: false })
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
})
const connection = await pool.connect()
try {
  await connection.query('begin isolation level repeatable read read only')
  await connection.query("set local statement_timeout = '30s'")
  const normalizedReservations = `with raw as (select cs.order_id,cs.state,o.order_status,r from checkout_session cs join sales_order o on o.id=cs.order_id cross join lateral jsonb_array_elements(case when jsonb_typeof(cs.reservations)='array' then cs.reservations else '[]'::jsonb end) r), parsed as (select order_id,state,order_status,
    case when coalesce(r->>'locationId','')~*'^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$' then (r->>'locationId')::uuid end location_id,
    case when coalesce(r->>'variantId','')~*'^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$' then (r->>'variantId')::uuid end variant_id,
    case when coalesce(r->>'quantity','')~'^[1-9][0-9]{0,9}$' then (r->>'quantity')::numeric end quantity from raw)`
  const checks = {
    schema: `select table_name,column_name,data_type,is_nullable from information_schema.columns where table_schema='public' order by table_name,ordinal_position`,
    indexes: `select tablename,indexname,indexdef from pg_indexes where schemaname='public' order by tablename,indexname`,
    invalidConstraints: `select conname,conrelid::regclass::text as table_name from pg_constraint where not convalidated and connamespace='public'::regnamespace`,
    invalidBalances: `select location_id,variant_id,quantity_on_hand,quantity_reserved from inventory_balance where quantity_on_hand<0 or quantity_reserved<0 or quantity_reserved>quantity_on_hand`,
    malformedReservations: `select cs.id,cs.order_id from checkout_session cs where jsonb_typeof(cs.reservations)<>'array' or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(cs.reservations)='array' then cs.reservations else '[]'::jsonb end) r where not(coalesce(r->>'locationId','')~*'^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$') or not(coalesce(r->>'variantId','')~*'^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$') or not(coalesce(r->>'quantity','')~'^[1-9][0-9]{0,9}$') or case when coalesce(r->>'quantity','')~'^[1-9][0-9]{0,9}$' then (r->>'quantity')::numeric>2147483647 else false end)`,
    orphanReservations: `${normalizedReservations} select distinct p.order_id,p.location_id,p.variant_id from parsed p left join inventory_location l on l.id=p.location_id left join product_variant v on v.id=p.variant_id where l.id is null or v.id is null`,
    reservationDrift: `${normalizedReservations}, held as (select location_id,variant_id,sum(quantity) expected from parsed where state not in ('cancelled','failed') and order_status not in ('completed','returned','cancelled') group by location_id,variant_id) select coalesce(b.location_id,h.location_id) location_id,coalesce(b.variant_id,h.variant_id) variant_id,b.quantity_reserved,coalesce(h.expected,0) expected from inventory_balance b full join held h on h.location_id=b.location_id and h.variant_id=b.variant_id where coalesce(b.quantity_reserved,0)<>coalesce(h.expected,0)`,
    duplicateCheckoutOrders: `select order_id,count(*) from checkout_session group by order_id having count(*)>1`,
    orphanMedia: `select m.id,m.product_id,m.variant_id from product_media m left join product p on p.id=m.product_id left join product_variant v on v.id=m.variant_id where p.id is null or (m.variant_id is not null and (v.id is null or v.product_id<>m.product_id))`,
    orphanSku: `select v.id from product_variant v left join product p on p.id=v.product_id where p.id is null`,
    categoryCycles: `with recursive paths as (select id,parent_id,array[id] path,false cycle from category union all select p.id,c.parent_id,p.path||c.id,c.id=any(p.path) from paths p join category c on c.id=p.parent_id where not p.cycle) select distinct id from paths where cycle`,
  }
  const report = {
    readOnly: (await connection.query('show transaction_read_only')).rows[0]
      .transaction_read_only,
  }
  for (const [name, query] of Object.entries(checks))
    report[name] = (await connection.query(query)).rows
  const [journal] = (
    await connection.query(
      "select to_regclass('drizzle.__drizzle_migrations') as name",
    )
  ).rows
  report.migrations = journal.name
    ? (
        await connection.query(
          'select name,hash from drizzle.__drizzle_migrations order by name',
        )
      ).rows
    : []
  await connection.query('rollback')
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  await connection.query('rollback').catch(() => {})
  console.error('Read-only audit failed:', error.code ?? error.name)
  process.exitCode = 1
} finally {
  connection.release()
  await pool.end()
}
