# Laptop Commerce

React/Vite/TanStack frontend và Express 5 API. Deno **2.9.7** quản lý dependency/tasks; backend production chạy Node **24** trên Vercel Functions. Client và server chạy riêng; không dùng Turbo.

```sh
deno install --frozen --allow-scripts=npm:@tailwindcss/oxide,npm:esbuild,npm:unrs-resolver
```

Cấu hình `server/.env.local` theo `server/.env.example` với database đã được chuẩn bị và secret riêng. File `.env.local` đang có không bị thay đổi bởi tasks. Migration cloud cần xác nhận phạm vi riêng; build/dev không tự migrate.

Chạy hai terminal từ root:

```sh
deno task dev:server
```

```sh
deno task dev:client
```

Frontend: `http://localhost:5173`. API: `http://127.0.0.1:5172`. Client gọi trực tiếp các endpoint backend, ví dụ `/auth` và `/catalog/search`; Better Auth và URL ảnh dùng origin server.

| Lệnh | Mục đích |
| --- | --- |
| `deno task build:client` / `build:server` | Build riêng từng app bằng Vite |
| `deno task lint:client` / `lint:server` | Lint source, tests và cấu hình đang dùng |
| `deno task test:client` / `test:server` | Unit/API tests; cloud mặc định skip |
| `deno task check` | Test, build, lint cả hai app theo thứ tự |
| `deno task test:postgres` | PostgreSQL tạm localhost + migration/concurrency; không chọn database cloud |
| `deno task test:e2e` | Sáu browser suite, mock mọi external API |
| `deno task --cwd server test:built` | Node 24 chạy entrypoint Vercel và bản build Vite trên localhost |
| `deno task audit:phase6` | Audit database cấu hình bằng transaction READ ONLY |

Browser tests cần Node 24 và Chromium: `deno task --cwd server --eval 'playwright install chromium'`.

Triển khai thành **hai Vercel project**, root directories lần lượt `client` và `server`. [Runbook Express/Vercel, OAuth, scheduler, SMTP, storage và migration](docs/PHASE-6-EXPRESS-VERCEL.md).

[Kế hoạch và trạng thái nghiệm thu](docs/implementation-plan.md), [legacy parity](docs/LEGACY-PARITY.md). Các tích hợp cloud/sandbox thật được báo riêng với kiểm thử local. [README cũ được giữ lại](docs/archive/README-LEGACY.md).
