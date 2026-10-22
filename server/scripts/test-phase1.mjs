import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import process from "node:process";

// This runner never reads DATABASE_URL. It always owns an isolated local cluster.
process.env.LC_ALL = "C";
process.env.LANG = "C";
const directory = await mkdtemp(join(tmpdir(), "laptop-phase1-"));
const socket = createServer();
await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const password = randomUUID();
const postgres = new EmbeddedPostgres({
  databaseDir: join(directory, "data"),
  user: "phase1",
  password,
  port,
  persistent: false,
  createPostgresUser: false,
  initdbFlags: ["--locale=C", "--encoding=UTF8"],
  postgresFlags: ["-h", "127.0.0.1", "-k", directory],
  onLog: () => {},
  onError: () => {},
});
let pool,
  started = false;
try {
  await postgres.initialise();
  await postgres.start();
  started = true;
  const url = `postgresql://phase1:${password}@127.0.0.1:${port}/postgres`;
  pool = new Pool({ connectionString: url });
  const migrations = (await readdir("src/database/migrations-v2")).sort();
  for (const migration of migrations) {
    const sql = await readFile(
      `src/database/migrations-v2/${migration}/migration.sql`,
      "utf8",
    );
    if (migration.includes("phase1_catalog_inventory")) {
      // Pre-existing checkout and ledger: migration must preserve balances exactly.
      await pool.query(`insert into "user" (id,name,email,email_verified,role,created_at,updated_at) values ('00000000-0000-4000-8000-000000000001','Migration fixture','migration@example.test',true,'master',now(),now());
      insert into product (id,name,slug) values ('00000000-0000-4000-8000-000000000002','Migration fixture','migration-fixture');
      insert into product_variant (id,product_id,sku,name,price) values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','MIGRATION','Fixture',100);
      insert into inventory_location (id,code,name) values ('00000000-0000-4000-8000-000000000004','MIGRATION','Fixture');
      insert into inventory_balance (location_id,variant_id,quantity_on_hand,quantity_reserved) values ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003',5,2);
      insert into sales_order (id,code,user_id,subtotal,grand_total) values ('00000000-0000-4000-8000-000000000005','MIGRATION','00000000-0000-4000-8000-000000000001',200,200);
      insert into checkout_session (user_id,request_key,fingerprint,order_id,provider,provider_amount,currency,reservations,expires_at) values ('00000000-0000-4000-8000-000000000001',gen_random_uuid(),'fixture','00000000-0000-4000-8000-000000000005','cod',200,'VND','[{"locationId":"00000000-0000-4000-8000-000000000004","variantId":"00000000-0000-4000-8000-000000000003","quantity":2}]',now()+interval '1 hour');
      insert into stock_movement (location_id,variant_id,type,quantity,reference_type,reference_id) values ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003','reservation',2,'order','00000000-0000-4000-8000-000000000005');`);
    }
    if (migration.includes("phase4_fulfillment_returns_jobs")) {
      await pool.query(`insert into sales_order(id,code,user_id,subtotal,discount_total,shipping_total,grand_total,order_status,payment_status,updated_at) values('00000000-0000-4000-8000-000000000006','PHASE4-LEGACY','00000000-0000-4000-8000-000000000001',300,1,30,329,'completed','paid',now()-interval '2 days');
      insert into sales_order_item(id,order_id,variant_id,sku,product_name,variant_name,unit_price,quantity,total) values('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000003','LEGACY','Fixture','Fixture',100,3,300);`);
    }
    const connection = await pool.connect();
    try {
      await connection.query("begin");
      await connection.query(sql);
      await connection.query("commit");
    } catch (error) {
      await connection.query("rollback");
      throw error;
    } finally {
      connection.release();
    }
  }
  console.log(
    "PostgreSQL 17: all migrations applied to disposable local fixtures; no cloud database used.",
  );
  const env = {
    ...process.env,
    DATABASE_URL: url,
    PHASE1_DATABASE_URL: url,
    RUN_PHASE1_POSTGRES_TESTS: "true",
    RUN_CLOUD_AUTH_TESTS: "true",
    BETTER_AUTH_API_KEY: "",
    GOOGLE_CLIENT_ID: "local-google-fixture-id",
    GOOGLE_CLIENT_SECRET: "local-google-fixture-secret",
    RUN_CLOUD_CHECKOUT_TESTS: "true",
    RUN_PARITY_CLOUD_TESTS: "false",
  };
  for (const command of [
    "audit:phase12",
    "audit:phase3",
    "audit:phase4",
    "audit:phase5",
    "audit:phase6",
  ]) {
    const audit = spawn(process.execPath, ["task", command], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    audit.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    const code = await new Promise((resolve) =>
      audit.on("exit", (code) => resolve(code ?? 1)),
    );
    const report = code === 0 ? JSON.parse(output) : null;
    if (
      !report ||
      report.readOnly !== "on" ||
      report.duplicates?.length ||
      report.orphanAccounts?.length ||
      report.invalidFactors?.length ||
      report.invalidAssignments?.length ||
      report.anonymizedWithSessions?.length ||
      report.missingTables?.length ||
      (Array.isArray(report.invalidBalances)
        ? report.invalidBalances.length
        : report.invalidBalances) ||
      report.duplicateReviews
    )
      throw new Error(
        `${command}: read-only migration audit regression failed`,
      );
    console.log(
      `${command}: READ ONLY preflight verified on temporary PostgreSQL.`,
    );
  }
  const child = spawn(
    process.execPath,
    [
      "task",
      "--eval",
      "vitest run tests/phase1-postgres.test.js tests/phase2-postgres.test.js tests/checkout-cloud.test.js tests/phase3-postgres.test.js tests/phase4-postgres.test.js tests/phase5-postgres.test.js tests/phase6-postgres.test.js tests/auth-cloud.test.js",
    ],
    { env, stdio: "inherit" },
  );
  process.exitCode = await new Promise((resolve) =>
    child.on("exit", (code) => resolve(code ?? 1)),
  );
} finally {
  await pool?.end();
  if (started) await postgres.stop();
  await rm(directory, { recursive: true, force: true });
}
