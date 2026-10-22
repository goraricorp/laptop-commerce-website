// Reconcile a database previously initialized with db:push. Never stamp an unverified schema.
import dotenv from 'dotenv'
import pg from 'pg'
import process from 'node:process'
import { readFile } from 'node:fs/promises'
import { readMigrationFiles } from 'drizzle-orm/migrator'
dotenv.config({ path: '.env.local', quiet: true })
const baseline = '20261018100435_checkout_payments'
const snapshot = JSON.parse(await readFile(`src/database/migrations-v2/${baseline}/snapshot.json`, 'utf8'))
const migrations = readMigrationFiles({ migrationsFolder: 'src/database/migrations-v2' }).filter(m => m.name <= baseline)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 })
const c = await pool.connect()
const normalize = type => type.replaceAll('"', '').replace(/^public\./, '').replaceAll('character varying', 'varchar').replaceAll('timestamp with time zone', 'timestamptz').replaceAll('timestamp without time zone', 'timestamp').replaceAll(/\s/g, '')
try {
  await c.query('BEGIN ISOLATION LEVEL SERIALIZABLE')
  if (process.argv.includes('--apply')) await c.query("select pg_advisory_xact_lock(hashtext('laptop-commerce-migration-baseline'))")
  const columns = (await c.query("select t.relname as table_name, a.attname as column_name, format_type(a.atttypid,a.atttypmod) as type, a.attnotnull as not_null from pg_attribute a join pg_class t on t.oid=a.attrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relkind='r' and a.attnum>0 and not a.attisdropped")).rows
  const constraints = (await c.query("select t.relname as table_name, x.conname as name, x.contype as type, pg_get_constraintdef(x.oid) as definition from pg_constraint x join pg_class t on t.oid=x.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public'")).rows
  const indexes = (await c.query("select tablename as table_name,indexname as name,indexdef as definition from pg_indexes where schemaname='public'")).rows
  const enums = (await c.query("select t.typname as name,array_agg(e.enumlabel::text order by e.enumsortorder) as values from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' group by t.typname")).rows
  const tables = new Set(columns.map(column => column.table_name))
  const differences = []
  for (const item of snapshot.ddl) {
    const tag = `${item.entityType}:${item.table ?? ''}:${item.name}`
    if (item.entityType === 'tables' && !tables.has(item.name)) differences.push(tag)
    if (item.entityType === 'columns') {
      const column = columns.find(column => column.table_name === item.table && column.column_name === item.name)
      if (!column || normalize(column.type) !== normalize(item.type) || column.not_null !== item.notNull) differences.push(tag)
    }
    if (item.entityType === 'enums' && JSON.stringify(enums.find(row => row.name === item.name)?.values) !== JSON.stringify(item.values)) differences.push(tag)
    if (['fks','pks','uniques','checks'].includes(item.entityType) && !constraints.some(row => row.table_name === item.table && row.name === item.name)) differences.push(tag)
    if (item.entityType === 'indexes' && !indexes.some(row => row.table_name === item.table && row.name === item.name && item.columns.every(column => row.definition.includes(column.value)))) differences.push(tag)
  }
  if (differences.length) throw Object.assign(new Error('Schema differs from the baseline; no history was changed'), { differences })
  const history = (await c.query('select name,hash from drizzle.__drizzle_migrations order by id')).rows
  if (history.length) throw new Error('Migration history is not empty; baseline operation refused')
  if (process.argv.includes('--apply')) {
    for (const migration of migrations) await c.query('insert into drizzle.__drizzle_migrations(hash,created_at,name) values ($1,$2,$3)', [migration.hash,migration.folderMillis,migration.name])
    await c.query('COMMIT')
  } else await c.query('ROLLBACK')
  console.log(JSON.stringify({ baseline, verifiedTables: tables.size, verifiedColumns: snapshot.ddl.filter(item => item.entityType === 'columns').length, stamped: process.argv.includes('--apply') ? migrations.map(m => m.name) : [] }))
} catch (error) {
  await c.query('ROLLBACK').catch(() => {})
  console.error(JSON.stringify({ message: error.message, differences: error.differences }))
  process.exitCode = 1
} finally { c.release(); await pool.end() }
