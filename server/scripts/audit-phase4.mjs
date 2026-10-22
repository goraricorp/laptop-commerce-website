import dotenv from "dotenv";
import pg from "pg";
import process from "node:process";
dotenv.config({ path: ".env.local", quiet: true, override: false });
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
});
let connection;
try {
  connection = await pool.connect();
  await connection.query("begin isolation level repeatable read read only");
  await connection.query("set local statement_timeout='30s'");
  const report = {
    readOnly: (await connection.query("show transaction_read_only")).rows[0]
      .transaction_read_only,
  };
  const queries = {
    multipleShipments:
      "select order_id,count(*)::int rows from shipment group by order_id having count(*)>1",
    multipleCollections:
      "select order_id,count(*)::int rows from payment where status in ('completed','refunded') group by order_id having count(*)>1",
    invalidDocuments: `select o.id from sales_order o left join sales_order_item i on i.order_id=o.id group by o.id having coalesce(sum(i.total),0)<=0 or o.grand_total<o.shipping_total or o.grand_total-o.shipping_total>coalesce(sum(i.total),0) or bool_or(i.total<>trunc(i.total) or i.quantity not between 1 and 10000) or o.grand_total<>trunc(o.grand_total) or o.shipping_total<>trunc(o.shipping_total)`,
    stockAlreadyIssued:
      "select distinct reference_id as order_id from stock_movement where reference_type='order' and type='issue'",
    legacyDeliveredFallback:
      "select o.id from sales_order o where order_status in ('completed','returned') and not exists(select 1 from shipment s where s.order_id=o.id and s.delivered_at is not null) and not exists(select 1 from order_status_history h where h.order_id=o.id and h.status='completed')",
    legacyRefundFlags:
      "select id,payment_status from sales_order where payment_status in ('refunded','partially_refunded')",
    paidLate: "select order_id from checkout_session where state='paid_late'",
    tables:
      "select tablename from pg_tables where schemaname='public' and tablename in ('order_fulfillment','refund','outbox','job_lease','sales_return','order_allocation') order by tablename",
  };
  for (const [name, query] of Object.entries(queries))
    report[name] = (await connection.query(query)).rows;
  const names = report.tables.map((t) => t.tablename);
  if (names.includes("refund"))
    report.refundOverages = (
      await connection.query(
        "select p.id as payment_id from payment p join refund r on r.payment_id=p.id and r.state<>'failed' group by p.id having sum(r.amount)>p.amount",
      )
    ).rows;
  if (names.includes("order_allocation"))
    report.allocationMismatches = (
      await connection.query(
        "select o.id from sales_order o join order_allocation a on a.order_id=o.id group by o.id having sum(a.net)<>o.grand_total-o.shipping_total",
      )
    ).rows;
  await connection.query("rollback");
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await connection?.query("rollback").catch(() => {});
  console.error("Phase 4 READ ONLY audit failed:", error.code ?? error.name);
  process.exitCode = 1;
} finally {
  connection?.release();
  await pool.end();
}
