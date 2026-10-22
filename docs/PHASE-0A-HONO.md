> Tài liệu lịch sử Phase 0A. HTTP runtime hiện tại đã chuyển sang **Express 5/Vite trên Vercel** ở [Phase 6](PHASE-6-EXPRESS-VERCEL.md); dùng runbook mới để chạy/deploy.

# Phase 0A — Deno workspace, Hono, Vercel

## Status

Implementation and local verification are complete. Production deployment, cloud-write tests and the following business phases have not been performed. Keep the phase approval boundary before Phase 1. Do not publish this backend while the catalog exposure findings scheduled for Phase 1 remain open.

## Local setup

Prerequisites: Deno 2.9.7, Node 24 (browser runner and npm native tooling), PostgreSQL/S3 configuration for actual business requests. Preserve the existing server/.env.local; configuration examples are documentation only.

From repository root:

```sh
deno install --frozen --allow-scripts=npm:@tailwindcss/oxide,npm:esbuild,npm:unrs-resolver
deno task dev
deno task test
deno task build
deno task lint
deno task check
deno task test:e2e
```

Deno workspace members are client and server. Root deno.lock is authoritative. Existing member lockfiles are preserved historical inputs, ignored by the workspace resolver. No existing resolved package version was intentionally upgraded. Hono 4.13.13 is now a direct backend dependency. Turbo orchestration and active Express middleware were replaced.

Frontend: localhost:5173. Hono: 127.0.0.1:5172. Vite forwards /api/* to backend /*. Browser HTTP, Better Auth and uploads use /api; VITE_PUBLIC_SERVER_URL no longer selects a cross-site browser API origin.

The production entrypoint is server/src/index.js, which exports Hono without starting a listener. Local server/src/dev.js calls Deno.serve. server/src/main.js remains an export alias. Services preserve prices, stock, ownership, payment and cart logic. HTTP controllers return Web Responses; exceptions reach the Hono error handler. Database pool is shared within each instance, max 3, with bounded connection/idle timeouts.

The fake /demo endpoints are no longer mounted. Legacy files remain present.

## Deploy two Vercel projects

No deployment has been performed by this change.

1. Import the repository twice, using Root Directory client and server respectively. Include files outside Root Directory so root deno.json/deno.lock are available.
2. Backend: select Hono and Node 24. server/vercel.mjs bootstraps the pinned Deno CLI using npx, installs the workspace with its frozen lock and runs the backend build. It does not need Deno as a production runtime.
3. Frontend: select Vite. client/vercel.mjs requires API_PROXY_ORIGIN to be the backend HTTPS origin without credentials, path or query. It creates the /api rewrite before the SPA fallback. Missing/invalid configuration fails explicitly. The build image uses pinned Deno bootstrap; no global Deno installation is assumed.
4. Backend environment: VITE_PUBLIC_CLIENT_URL=https://frontend.example; VITE_PUBLIC_SERVER_URL=https://frontend.example/api (for public asset URLs); BETTER_AUTH_URL=https://frontend.example/api/auth. Keep BETTER_AUTH_SECRET unchanged to preserve sessions. Configure database, bucket, SMTP and payment secrets on the backend only.
5. Better Auth still exposes backend /auth/*. The Hono adapter restores the configured public auth pathname after /api is stripped by the proxy. Callback/reset/verification URLs use the public auth URL. Do not forward arbitrary request hosts into authentication configuration.
6. Exact trusted origin and CORS origin must match the frontend URL. Previews need their own matching frontend/backend configuration. Do not use wildcard trusted origins or copy production credentials into untrusted previews.
7. Smoke-check /health, frontend /api/health and /api/auth/ok, then verify cookies and auth on a preview before production promotion.

Payment webhook URLs may keep their backend paths. Stripe consumes the exact raw request text before JSON parsing. MoMo/ZaloPay callbacks validate provider signatures without requiring a browser session. No provider call or refund was executed during verification.

## Upload and rate limits

Accepted uploads: PNG/JPG/JPEG/WebP, one file, nonempty, matching extension/MIME/signature, at most 4,000,000 bytes. A lower configured limit is respected; a larger existing environment limit is clamped. Total HTTP body limit is 4,100,000 bytes. UUID object names, pending manifest, cancel/delete, reference protection and failed-insert compensation remain intact. Existing GIF/AVIF/PDF object read URLs remain readable for compatibility; new uploads cannot create those formats.

Checkout, wallet and upload rate limits use atomic UPSERT in the existing rate_limit table, partitioned by hashed authenticated user and scope. No migration is required. Failure to persist a limiter result fails the request rather than bypassing protection. The in-memory limiter is removed.

Serverless entrypoints never start storage timers. Until the authenticated scheduler endpoints in Phase 4 are implemented and deployed, invoke the existing cleanup CLI through an approved operational environment:

```sh
deno task --cwd server storage:cleanup
```

Do not consider unattended orphan cleanup operational until that scheduler is configured. Do not run the cleanup CLI as a read-only check: it deletes eligible bucket objects.

## Verification and limitations

Unit/API tests mock provider/bucket writes. Hono auth integration uses the actual Better Auth package with an in-memory database and mocked email delivery. Browser suites intercept /api calls with fixtures; they do not prove cloud providers work.

Default cloud suites stay skipped. The integration launcher refuses to run without CLOUD_TESTS_APPROVED=true and explicitly selected RUN_CLOUD_AUTH_TESTS, RUN_CLOUD_CHECKOUT_TESTS or RUN_PARITY_CLOUD_TESTS. Set those only after approval of the exact database and disposable-fixture scope. Never run DB migrations or integration writes from a build/startup hook.

Root lint/check still fail on the baseline client source/template issues; the server source and tests must pass lint. Full client cleanup remains Phase 6. Browser development tooling can print ResizeObserver diagnostics even when application assertions pass; these have not been suppressed.

## Database and rollback

No migration or cloud fixture was run. Only existing tables are used in this phase. No environment secret file was modified, no commit/push was made, and legacy pkg directories are retained.

Rollback requires keeping frontend proxy/auth paths and the backend public auth URL compatible as a set. Keep the auth secret stable. Once Phase 1 catalog protections are deployed, do not roll back to the unsafe public DTO behavior. Removing a deployment does not undo external payments or bucket operations.

### Results (2026-10-21)

- Frozen root install: passed; existing resolved package versions unchanged.
- Root tests: client 20 passed; server 89 passed, 14 cloud tests skipped.
- Root build: both members passed. Built backend health executed on Node 24: HTTP 200.
- Root dev: both members started; direct Hono health and frontend /api/health returned HTTP 200.
- Browser: admin rows/user edit, image upload/cancel/save/failure/leave, cart quantity, statistics/detail, voucher and review summary passed; all six checkout scenarios passed (COD, MoMo, ZaloPay, PayPal, Stripe, Stripe retry), with mocked APIs.
- Node 24 HTTP/auth compatibility: 24 tests passed against the native Request/Response implementation.
- Server source/tests lint: passed. Changed client files: 0 errors, 1 existing hook-dependency warning. Root lint: 2103 errors and 33 warnings in client, including legacy/templates; not passed.
- Real PostgreSQL verification was READ ONLY: SELECT connectivity and EXPLAIN (without ANALYZE) of the rate-limit UPSERT succeeded. No INSERT or migration was executed. Direct auth /ok in the restricted sandbox could not access the DB; real cloud session/rate-limit writes remain unverified and need approval. The actual auth flows passed with the memory database.
- Root integration launcher without approval: refused before running any cloud suite, exit 2.
- Scoped diff whitespace check: passed. Whole repository diff still has unrelated pre-existing whitespace in japtor.txt.
