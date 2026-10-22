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
  const required = [
    "inventory_operation",
    "storefront_campaign",
    "order_fulfillment",
    "sales_return",
    "refund",
    "outbox",
    "two_factor",
    "newsletter_subscription",
    "http_session",
  ];
  const report = {
    readOnly: (await connection.query("show transaction_read_only")).rows[0]
      .transaction_read_only,
  };
  report.presentTables = (
    await connection.query(
      "select tablename from pg_tables where schemaname='public' and tablename=any($1) order by tablename",
      [required],
    )
  ).rows.map((r) => r.tablename);
  report.missingTables = required.filter(
    (name) => !report.presentTables.includes(name),
  );
  report.invalidBalances = (
    await connection.query(
      "select count(*)::int as count from inventory_balance where quantity_on_hand<0 or quantity_reserved<0 or quantity_reserved>quantity_on_hand",
    )
  ).rows[0].count;
  report.duplicateReviews = (
    await connection.query(
      "select count(*)::int as count from (select user_id,product_id from product_review where user_id is not null group by user_id,product_id having count(*)>1) t",
    )
  ).rows[0].count;
  const journal = (
    await connection.query(
      "select to_regclass('drizzle.__drizzle_migrations') as name",
    )
  ).rows[0];
  report.migrations = journal.name
    ? (
        await connection.query(
          "select name from drizzle.__drizzle_migrations order by name",
        )
      ).rows.map((r) => r.name)
    : [];
  if (report.presentTables.includes("http_session"))
    report.auxiliarySessions = (
      await connection.query(
        "select count(*)::int as total,count(*) filter(where expires_at<=now())::int as expired from http_session",
      )
    ).rows[0];
  await connection.query("rollback");
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await connection?.query("rollback").catch(() => {});
  console.error("Phase 6 read-only audit failed:", error.code ?? error.name);
  process.exitCode = 1;
} finally {
  connection?.release();
  await pool.end();
}
