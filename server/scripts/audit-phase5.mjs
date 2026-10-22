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
  report.tables = (
    await connection.query(
      "select tablename from pg_tables where schemaname='public' and tablename in ('two_factor','favorite','notification_preference','newsletter_subscription','newsletter_token','account_audit','catalog_write','support_command') order by tablename",
    )
  ).rows;
  report.legacySupport = (
    await connection.query(
      "select count(*)::int as conversations from conversation where type='support'",
    )
  ).rows;
  report.orphanAccounts = (
    await connection.query(
      'select a.id from account a left join "user" u on u.id=a.user_id where u.id is null',
    )
  ).rows;
  report.columns = (
    await connection.query(
      "select table_name,column_name,data_type from information_schema.columns where table_schema='public' and table_name in ('user','session','conversation','product','upload_asset') and column_name in ('two_factor_enabled','anonymized_at','second_factor_at','reauthenticated_at','owner_id','assigned_to_id','version','purpose') order by table_name,column_name",
    )
  ).rows;
  if (report.tables.some((t) => t.tablename === "two_factor")) {
    report.invalidFactors = (
      await connection.query(
        'select u.id from "user" u left join two_factor f on f.user_id=u.id where u.two_factor_enabled=true and (f.id is null or f.verified is not true)',
      )
    ).rows;
    report.invalidAssignments = (
      await connection.query(
        "select c.id from conversation c left join \"user\" u on u.id=c.assigned_to_id where c.assigned_to_id is not null and (u.id is null or u.role not in ('moderator','administrator','master') or u.anonymized_at is not null)",
      )
    ).rows;
    report.anonymizedWithSessions = (
      await connection.query(
        'select u.id from "user" u where u.anonymized_at is not null and exists(select 1 from session s where s.user_id=u.id)',
      )
    ).rows;
    report.pendingSecondFactor = (
      await connection.query(
        'select count(*)::int as sessions from session s join "user" u on u.id=s.user_id where u.two_factor_enabled and s.second_factor_at is null',
      )
    ).rows;
  }
  const journal = (
    await connection.query(
      "select to_regclass('drizzle.__drizzle_migrations') as name",
    )
  ).rows[0];
  report.migrations = journal.name
    ? (
        await connection.query(
          "select name,hash from drizzle.__drizzle_migrations order by name",
        )
      ).rows
    : [];
  await connection.query("rollback");
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await connection?.query("rollback").catch(() => {});
  console.error("Phase 5 read-only audit failed:", error.code ?? error.name);
  process.exitCode = 1;
} finally {
  connection?.release();
  await pool.end();
}
