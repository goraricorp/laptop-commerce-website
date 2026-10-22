import dotenv from 'dotenv'
import pg from 'pg'
import process from 'node:process'
dotenv.config({ path: '.env.local', quiet: true, override: false })
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
})
let connection
try {
  connection = await pool.connect()
  await connection.query('begin isolation level repeatable read read only')
  await connection.query("set local statement_timeout='30s'")
  const report = {
    readOnly: (await connection.query('show transaction_read_only')).rows[0]
      .transaction_read_only,
  }
  const checks = {
    duplicates: `select provider_id,count(*) as rows,array_agg(id order by id) as account_ids from account group by provider_id,account_id having count(*)>1`,
    orphanAccounts: `select a.id from account a left join "user" u on u.id=a.user_id where u.id is null`,
    invalidCredentials: `select id from account where provider_id='credential' and (account_id<>user_id::text or password is null)`,
    invalidSubjects: `select id,provider_id from account where btrim(account_id)=''`,
    providers: `select provider_id,count(*)::int accounts from account group by provider_id`,
    columns: `select table_name,column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and table_name in ('sales_order','account') order by table_name,ordinal_position`,
    indexes: `select tablename,indexname,indexdef from pg_indexes where schemaname='public' and tablename in ('account','sales_order') order by tablename,indexname`,
  }
  for (const [name, query] of Object.entries(checks))
    report[name] = (await connection.query(query)).rows
  const journal = (
    await connection.query(
      "select to_regclass('drizzle.__drizzle_migrations') as name",
    )
  ).rows[0]
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
  await connection?.query('rollback').catch(() => {})
  console.error('Phase 3 read-only audit failed:', error.code ?? error.name)
  process.exitCode = 1
} finally {
  connection?.release()
  await pool.end()
}
