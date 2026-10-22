# Phase 6 — Express 5, Vite, chất lượng và nghiệm thu

Cập nhật 22/10/2026. **DONE code và nghiệm thu local; PARTIAL rollout.** Kiến trúc Express thay lựa chọn Hono của Phase 0A theo yêu cầu mới. Client/server chạy riêng, không có Turbo. API client hiện gọi thẳng server origin bằng đường dẫn không có `/api`; build và lint đã qua sau thay đổi này, browser/auth cross-origin regression chưa chạy lại. Cập nhật sau phê duyệt: 9 migration Phase 1–6 đã áp dụng cloud ngày 22/10/2026, schema và API đọc đã kiểm tra; deployment Vercel/Google/SMTP/storage/scheduler/provider sandbox thật chưa nghiệm thu. [Bằng chứng cloud và giới hạn](CLOUD-MIGRATION-2026-10-22.md). Các ghi chú chưa apply ở phần nghiệm thu ban đầu dưới đây là lịch sử trước đợt cập nhật này.

## Kiến trúc đã triển khai

`client/src` → React/Vite/TanStack → Express 5 API trên origin server riêng → services/Drizzle/PostgreSQL. Mọi controller nhận `req/res/next` thật; không có lớp giả lập Hono trong production. Helper Web Request/Response chỉ còn ở tests để inject request vào Express mà không cần socket.

Backend dùng Express **5.3.0**, CORS **2.8.6**, Helmet **8.3.0**, express-rate-limit **8.7.1**, express-session **1.19.0**, Multer **2.4.0**, cookie-parser **1.4.7**, compression **1.8.2**. Deno lockfile giữ phiên bản resolve. Không nâng cấp đồng loạt dependency ứng dụng. Hono đã bỏ khỏi direct dependency và toàn bộ HTTP source; lock vẫn có dependency Hono gián tiếp của `@better-auth/infra`, không làm entrypoint/router ứng dụng.

| Điểm tích hợp | Hành vi |
| --- | --- |
| HTTP | Express 5 async errors vào JSON error handler; query parser simple; 404/validation/413/multipart/provider errors không lộ stack hoặc payload nhạy cảm |
| Helmet/CORS | Bỏ X-Powered-By và ETag, security headers; CORS đúng client origin/credentials; giữ origin/Fetch Metadata guards ở write routes |
| Better Auth | `toNodeHandler`/`fromNodeHeaders`, mount Better Auth tại `/auth` trên origin server, gắn cookie/CSRF/ownership/role/2FA assurance; mount trước JSON parser |
| Request body | JSON/urlencoded giới hạn 4.100.000 byte; Stripe nhận Buffer nguyên vẹn trước parser; webhook provider còn kiểm signature và inbox như cũ |
| Upload | Multer memoryStorage, một file, tối đa 4.000.000 byte, không field phụ; chỉ PNG/JPG/JPEG/WebP, chữ ký ảnh/UUID/manifest/lifecycle và quyền ảnh support giữ nguyên; không ghi disk serverless |
| Rate limit | express-rate-limit dùng atomic PostgreSQL upsert; cùng user/scope chia ngân sách giữa instance; public IP dùng Express trust proxy + IPv6 grouping, newsletter thêm giới hạn email; store lỗi thì fail closed |
| Session | Better Auth vẫn là nguồn đăng nhập. express-session chỉ là session phụ trợ, PostgreSQL store, cookie khác `lc.http.sid`, HttpOnly/SameSite=Lax/Secure ở HTTPS, TTL 8 giờ, resave=false/saveUninitialized=false; không sinh cookie/row cho người xem chưa dùng session |
| Serverless | Production export app, không listen hoặc tạo timer. Chỉ dev/preview CLI mở listener. Pool dùng lại theo instance, tối đa 3 connection; jobs HTTPS/lease/outbox tiếp tục hoạt động |
| Dọn session | Bảng session phụ trợ có index expires_at; job images đã xác thực dọn tối đa 100 session hết hạn, không có interval trong instance |

Middleware và API dùng [Express 5](https://expressjs.com/en/guide/migrating-5/), [Better Auth Node integration](https://better-auth.com/docs/integrations/express), [Multer](https://expressjs.com/en/resources/middleware/multer/) và [express-session](https://expressjs.com/en/resources/middleware/session/). Không thay thuật toán checkout, voucher, reserve/issue/return/refund hoặc phân quyền bằng session phụ trợ.

## Chất lượng frontend

- Giữ nguyên `client/pkg` và lịch sử workspace. **154 module** template không được entrypoint/route/tests import được chuyển sang `client/archive/templates/src` với manifest và phương pháp kiểm tra. Đồ thị có static/dynamic literal imports, re-exports và directory index JS/TS; 17 module barrel/logo TypeScript có phụ thuộc runtime được giữ lại. Build và browser regression kiểm tra các đường import thực.
- Lint chỉ loại legacy/pkg, archive đã đối chiếu, generated route tree và build artifacts. Không tắt rule trong source chạy để che lỗi; source hiện không có eslint-disable ngoài generated code.
- Bỏ 118 catch chỉ ném lại nguyên lỗi và các directive no-useless-catch trong service backend; giữ catch có xử lý bù trừ hoặc chuyển lỗi nghiệp vụ. Lỗi async tiếp tục tới Express error handler.
- Bổ sung PropTypes cho component đang chạy; đổi tên nội bộ các service hook thành `use...`, giữ alias/interface resource hiện có; tách hook/context/variant/toast manager khỏi component để Fast Refresh đúng.
- Tách route wrappers khỏi file Route và giữ key theo sản phẩm/bộ lọc; useIsMobile dùng useSyncExternalStore. Callback cleanup ảnh ổn định để không dọn draft do render lại. Tailwind chỉ quét `src`, không lấy class từ archive/pkg.
- `.github/workflows/ci.yml` cài Node 24/Deno 2.9.7, frozen install, lint/unit/build, Node artifact smoke, migration check, PostgreSQL tạm và Chromium/browser tests. Workflow không nhận secret production, không migrate hoặc test ghi cloud. Cấu hình được kiểm tra local; chưa trigger một lần chạy GitHub Actions thật.

## Lệnh chạy riêng

Từ root dùng `deno task dev:server` và `deno task dev:client` trong hai terminal. Có build/test/lint riêng cho từng app; root build/test/lint/check chỉ là các helper chạy tuần tự. Không có task dev khởi động cả hai cùng lúc, không có Turbo.

Có thể chạy trực tiếp `deno run dev` trong từng thư mục client/server. Script dev server chỉ là `vite --port 5172`; Vite mount Express trên 127.0.0.1:5172 bằng plugin trong `server/vite.config.js`, không có listener dev riêng. Plugin dùng `ssrLoadModule` để nạp lại source khi sửa và prebundle sanitize-html để tương thích CommonJS/ESM trên Deno. `deno task --cwd server preview` chạy artifact `dist/index.js`; cần build server trước.

`deno install --frozen --cached-only ...` đã qua tại workspace hiện tại. CI/Vercel bỏ cached-only để tải package theo lock. Deno compatibility runtime báo Node 26 cho engines check; artifact production đã được thử bằng Node **24.21.0** thật, không kết luận chỉ từ Deno.

## Hai Vercel project

| Thiết lập | Frontend | Backend |
| --- | --- | --- |
| Root Directory | `client` | `server` |
| Framework | Vite | Other/Node Functions (`framework:null`) |
| Runtime | static SPA | Node 24.x |
| Install | config dùng Deno 2.9.7 frozen install từ workspace root | tương tự |
| Build | `deno task build` trong client | `deno task build` trong server, Vite SSR target node24 |
| Entrypoint | dist/index.html | `api/index.js` → `../dist/index.js` do Vite tạo |
| Routing | SPA fallback; API origin cấu hình qua `VITE_PUBLIC_SERVER_URL` | rewrite mọi path về API function, Express nhận endpoint như `/auth`, `/product`, `/cart` |
| Function | — | includeFiles `dist/**`, maxDuration 60 giây |

Đây là một [Node Vercel Function](https://vercel.com/docs/functions/runtimes/node-js) phục vụ Express và sử dụng đúng artifact Vite; không để Vercel xây thêm một app Hono hoặc chỉ build Vite rồi bỏ qua artifact. `server/src/index.js` chỉ export app; `api/index.js` nạp output. `deno task --cwd server test:built` đã thực sự chạy đường import này với Node 24 và HTTP localhost.

Frontend cấu hình `VITE_PUBLIC_SERVER_URL` thành origin HTTPS của project backend. Client gọi trực tiếp server; `client/vercel.mjs` chỉ cấu hình SPA fallback. Domain hiện định cấu hình là `https://example-client.vercel.app` và `https://example-server.vercel.app`; đặt cả `VITE_PUBLIC_CLIENT_URL` và `VITE_PUBLIC_SERVER_URL` trong env của cả hai project. Đây là hai site khác nhau: cookie `SameSite=None; Secure` cho phép credentialed requests ở trình duyệt chấp nhận third-party cookies, nhưng Safari ITP và chính sách chặn third-party cookie có thể vẫn ngăn auth. Hỗ trợ đầy đủ các trình duyệt đó cần hai custom domain cùng site. [Vercel hỗ trợ cấu hình programmatic `.mjs`](https://vercel.com/docs/project-configuration/vercel-ts). Cho hai project truy cập workspace files bên ngoài Root Directory để đọc root deno.lock/node_modules. Không đổi root outputDirectory backend thành frontend dist.

### Biến môi trường

Backend:

- `DATABASE_URL`: pooled PostgreSQL URL; không đặt vào client hoặc VITE variable.
- `VITE_PUBLIC_CLIENT_URL`: `https://example-client.vercel.app`; đặt trong cả client và server project.
- `BETTER_AUTH_URL`: `https://example-server.vercel.app/auth`; Better Auth Secret đủ ngẫu nhiên, ít nhất 32 ký tự. Không tạo/đổi secret trong migration/build. Session phụ trợ derive key theo purpose riêng; không thay cookie Better Auth.
- `VITE_PUBLIC_SERVER_URL`: `https://example-server.vercel.app`; cấu hình cả trong client project (API base URL) và server project (URL ảnh công khai). Credentials không được đặt ở đây.
- Google Client ID/Secret ở backend; callback đăng ký `https://example-server.vercel.app/auth/callback/google`. Preview cần origin/callback và credentials riêng phù hợp; không dùng wildcard trusted origins.
- SMTP: EMAIL_USER, EMAIL_APSS, EMAIL_FROM và cấu hình mailer hiện có. EMAIL_APSS là app password, không dùng EMAIL_PASS làm fallback.
- Storage: AWS endpoint/access key/secret/region, bucket có **policy private**, allowed MIME PNG/JPEG/WebP, max file 4.000.000. Tên bucket có thể vẫn là `public` nhưng anonymous GetObject phải bị chặn; support URL chỉ cấp signed URL 60 giây sau authorization.
- Payment sandbox: Stripe/MoMo/ZaloPay/PayPal theo `.env.example`, provider enabled riêng; PayPal environment/currency conversion/webhook ID phải đúng. Không giả lập thanh toán thành công khi thiếu cấu hình.
- `INTERNAL_JOB_SECRET`: ít nhất 32 ký tự, chỉ scheduler/backend biết. Vercel tự đặt `VERCEL=1`, khi đó Express trust một proxy; local không tin X-Forwarded-For từ client để giới hạn public IP.

Local mẫu dùng client `http://localhost:5173` và API/auth/ảnh tại `http://127.0.0.1:5172`, với `BETTER_AUTH_URL=http://127.0.0.1:5172/auth`. Không commit giá trị môi trường local.

### Scheduler và vận hành

Scheduler HTTPS ngoài gọi POST `/internal/jobs/dispatch` và `/internal/jobs/checkout` mỗi phút; `/internal/jobs/images` mỗi giờ. Gửi Authorization bearer secret, không gắn secret lên query string hoặc log. Job có lease, bounded batch/deadline và SKIP LOCKED; không dựa vào tiến trình serverless sống lâu. Images cleanup cũng xóa session phụ trợ hết hạn. Kiểm tra dashboard backlog/lỗi/lần chạy cuối và provider needs_review; xử lý đối soát bằng command có audit.

Kiểm thử SMTP/provider/storage/scheduler thật phải có phạm vi được duyệt. SMTP là at least once; retry outbox không phải bằng chứng email hoặc refund đã hoàn tất ngoài hệ thống.

## Migration và rollout an toàn

Migration mới: `20261021165401_phase6_express_sessions`, chỉ thêm `http_session(sid,data,expires_at)` và index TTL; không đổi bảng Better Auth, không backfill chứng từ hoặc tồn kho. `createTableIfMissing`/migrate trong request không được dùng.

Audit cloud chỉ đọc ngày 22/10/2026: transaction READ ONLY; 0 balance vi phạm bất biến, 0 review user/product trùng; schema Phase 1–6 vẫn chưa hiện diện trong các bảng được kiểm tra, history cuối là `20261021014954_blushing_marauders`. Không áp dụng migration hoặc test ghi cloud trong đợt này.

Trình tự rollout:

1. Chạy các audit read-only Phase 1–6, đối chiếu schema, journal, orphan/duplicate và bản sao lưu. Đặc biệt cần policy bucket riêng tư trước khi bật ảnh support.
2. Xin duyệt **database đích + tập migration mới + phạm vi ghi fixtures** cụ thể. Phê duyệt migration cũ không áp dụng cho Phase 1–6 đang pending. Không dùng db:push/reset, không tự sửa số tồn/chứng từ khi audit phát hiện sai lệch.
3. Sau khi được duyệt, sao lưu và apply mọi migration pending theo thứ tự, gồm migration session Phase 6; xác minh table/index/FK/trigger/columns. Deploy code hiện tại lên schema đã chuẩn bị.
4. Cấu hình hai project/env/domain, đặt `VITE_PUBLIC_SERVER_URL` ở client thành API origin và kiểm tra CORS/cookie/auth trực tiếp, raw signed webhook, upload/cancel/save, Google + pending 2FA; chạy sandbox E2E trên fixtures riêng rồi dọn. Health chỉ là liveness, không chứng minh database và provider đã sẵn sàng.
5. Bật scheduler và theo dõi leases/backlog/refund/payment đối soát. Không công bố nghiệm thu đầy đủ trước khi các tích hợp thật qua hoặc giới hạn được chấp nhận rõ ràng.

Rollback ưu tiên deployment tương thích, giữ bảng/dữ liệu mới; tắt traffic ghi khi cần. Không rollback public catalog về phiên bản lộ trường riêng, không down migration phá dữ liệu. Code rollback không hoàn tác được tiền đã thanh toán/hoàn ở provider. Dữ liệu tombstone, ledger và chứng từ cần tiếp tục được tôn trọng.

## Bằng chứng và giới hạn

| Kiểm tra | Kết quả local |
| --- | --- |
| Client unit | **26 passed** |
| Server unit/API | **124 passed, 98 opt-in skipped** |
| PostgreSQL 17 tạm | **94 passed**: 91 regression Phase 1–5/native auth/checkout + 3 session/rate-limit Phase 6 |
| Browser | **6 suites PASS trước lần đổi API origin**; fixture đã chuyển sang server origin nhưng cần chạy lại để xác nhận CORS/cookie và các luồng browser |
| Lint | **0 errors, 0 warnings** client và server; không thêm rule suppression |
| Build | Vite client và Vite SSR server PASS; server có cảnh báo dynamic import trùng static import không ảnh hưởng kết quả build |
| Node production artifact | **PASS Node 24.21.0**, Vercel API entry → Vite artifact → Express HTTP; Helmet/CORS/JSON error/auth guard |
| Migration check | PASS; tất cả DDL áp dụng thành công trên cluster tạm |
| Frozen install | PASS từ cache theo root lock |
| Cloud audit | Chỉ READ ONLY; không migration hoặc giao dịch thật |

Vitest chạy native Express, Better Auth và PostgreSQL thật trong các suite tương ứng; SMTP/S3/provider adapters mock. Browser có cảnh báo ResizeObserver trong chế độ Vite dev khi resize; kiểm tra nghiệp vụ không gặp runtime exception. CI mới chưa chạy trên GitHub; Vercel edge/rewrite/cookie, Google thật, provider refund/SMTP/bucket policy/scheduler thật chưa được chứng minh bởi local smoke.

Toàn bộ phạm vi triển khai code Phase 6 đã hoàn tất; nghiệm thu end-to-end production tiếp tục **PARTIAL/BLOCKED** bởi migration và tích hợp ngoài hệ thống. Không coi build xanh là thay thế nghiệm thu đó.
