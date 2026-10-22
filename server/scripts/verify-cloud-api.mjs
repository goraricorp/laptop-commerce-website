import assert from "node:assert/strict";
import process from "node:process";
import { createServer } from "vite";

if (!process.argv.includes("--read-only"))
  throw Error("Pass --read-only to verify APIs against the configured database.");
// Every pg connection opened by this isolated process must reject SQL writes.
process.env.PGOPTIONS = `${process.env.PGOPTIONS ?? ""} -c default_transaction_read_only=on`;
const server = await createServer({
  configFile: "./vite.config.js",
  server: { host: "127.0.0.1", port: 0, open: false },
  logLevel: "error",
});
let pool;
try {
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const results = [];
  async function check(path, expected = 200, options = {}) {
    const response = await fetch(base + path, {
      ...options,
      signal: AbortSignal.timeout(30000),
    });
    const payload = await response.json();
    assert.equal(response.status, expected, path.split("?")[0]);
    results.push({ path: path.split("?")[0], status: response.status });
    return payload;
  }
  assert.equal((await check("/health")).status, "ok");
  const catalog = await check("/catalog/search?limit=2");
  assert.ok(Array.isArray(catalog.items));
  assert.ok(Number.isFinite(catalog.total));
  for (const path of [
    "/catalog/campaigns",
    "/catalog/spotlight",
    "/catalog/category",
    "/catalog/brand",
  ])
    await check(path);
  let productChecks = 0;
  if (catalog.items.length) {
    const id = catalog.items[0].id;
    assert.match(id, /^[0-9a-f-]{36}$/);
    await check(`/product/${id}/details`);
    const summary = await check(`/review/summary?productId=${id}`);
    assert.equal(typeof summary.count, "number");
    productChecks = 2;
  }
  await check("/auth/providers");
  for (const path of [
    "/me/cart",
    "/me/orders",
    "/me/favorites",
    "/me/preferences",
    "/admin/statistics",
    "/admin/catalog/products",
  ])
    await check(path, 401);
  await check("/checkout/quote", 401, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  await check("/catalog/search?limit=0", 400);
  const { auth } = await server.ssrLoadModule("/src/lib/auth/index.js");
  // HTTP auth endpoints persist rate-limit counters, even for GET. The native
  // API verifies session reads without those writes in this read-only probe.
  assert.equal(await auth.api.getSession({ headers: new Headers() }), null);
  const context = await auth.$context;
  // Exercise the exact native adapter projection without attempting sign-in.
  const account = await context.internalAdapter.findUserByEmail(
    "migration-schema-check-20261022@example.invalid",
  );
  assert.ok(!account || !account.user);
  ({ pool } = await server.ssrLoadModule("/src/database/index.js"));
  const mode = (await pool.query("show transaction_read_only")).rows[0]
    .transaction_read_only;
  assert.equal(mode, "on");
  console.log(
    JSON.stringify(
      {
        transport: "Vite -> Express -> configured PostgreSQL",
        databaseReadOnly: mode,
        checks: results.length,
        results,
        productChecks,
        nativeBetterAuthUserLookup: "PASS",
        nativeBetterAuthSessionRead: "PASS",
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
  await pool?.end();
}
