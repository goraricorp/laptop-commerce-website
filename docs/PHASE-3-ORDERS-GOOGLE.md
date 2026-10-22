# Phase 3 — Đơn hàng và Google authentication

Ngày kiểm tra: 21/10/2026. Chỉ triển khai Phase 3 và phần tích hợp cần thiết với code có sẵn. Không áp migration, gửi email, thanh toán hoặc hoàn tiền thật.

## Trạng thái

| Hạng mục | Trạng thái | Bằng chứng/giới hạn |
| --- | --- | --- |
| Lịch sử khách và workflow admin không giới hạn 100 đơn | DONE local | 225 đơn cùng khoảng microsecond, cả hai chiều sort, chèn đơn mới giữa hai trang, tổng theo bộ lọc và ownership trên PostgreSQL 17 |
| Đọc chi tiết đơn legacy của tài khoản | DONE local | Không cần checkout_session, kiểm userId; giữ snapshot và không tạo nút gọi payment cho đơn không có checkout hiện đại |
| Google login/link/unlink và lỗi callback | DONE code/local | Better Auth **1.7.11** thực tế trong lock/install; state/PKCE/cookie/callback thật của thư viện, chỉ adapter Google được mô phỏng |
| Bảo vệ gỡ phương thức đăng nhập cuối cùng | DONE local | Khóa user trong transaction; hai unlink đồng thời chỉ một thành công; chặn provider thiếu cấu hình/identity rỗng, session cũ, unverified và account người khác |
| Đăng nhập Google với Google thật | **BLOCKED** | Cấu hình hiện tại thiếu GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; chưa thực hiện callback với Google thật |
| Migration và Vercel rollout | PARTIAL | Migration mới đã tạo và kiểm trên PostgreSQL tạm; chưa được duyệt/apply trên Neon |

## Đơn hàng

`GET /me/orders` đổi response từ mảng tối đa 100 thành trang cursor. `GET /admin/orders` phục vụ workflow admin/master. Các endpoint thống kê phân trang hiện có và CRUD đơn hàng cũ giữ nguyên.

Query dùng chung: `q`, `status` (`all/pending/confirmed/processing/completed/cancelled/returned`), `group` (`all/processing/awaitingDelivery/completed/cancelled`), `sort` (`newest/oldest`), `limit` (1–100, mặc định 25), `cursor`, `asOf`. Query strict, không nhận userId hoặc page offset để đổi phạm vi.

Response: `{ items, total, limit, asOf, hasMore, nextCursor }`. Item có `itemCount` từ snapshot dòng đơn; admin thêm tên/email khách thật. Search SQL theo mã đơn, SKU/tên sản phẩm trong snapshot; admin tìm thêm tên/email khách. Lịch sử khách lấy mọi sales_order thuộc userId của phiên, gồm đơn legacy không có checkout_session; không nhận đơn guest chỉ vì trùng email.

Keyset dùng `(createdAt,id)` và mốc asOf. Cursor được HMAC theo domain riêng, gắn owner/admin, filter, sort, limit và mốc snapshot. Timestamp cursor/asOf giữ **6 chữ số microsecond của PostgreSQL**, không đi qua Date làm mất độ chính xác. Count và trang lấy cùng một statement snapshot. Mốc asOf ngăn đơn mới có ngày tạo sau mốc chen vào khi đang duyệt; trạng thái đơn vẫn là dữ liệu hiện tại, không phải transaction snapshot dài qua nhiều request. Đổi filter/sort hoặc refresh sẽ bắt đầu lại; workflow reset về trang đầu và tải tổng mới sau chuyển trạng thái.

Frontend có tìm kiếm, lọc, sort, trước/sau, loading/error/empty và làm mới. DataTable thêm tùy chọn ẩn phân trang nội bộ, mặc định giữ hành vi cũ cho các bảng khác. `use-order-page.js` giữ cursor stack và asOf khi đi lùi. Giỏ và payment hiện tại tiếp tục hoạt động; chi tiết đơn legacy chỉ hiển thị snapshot, không gọi refresh/payment của checkout mới.

File chính: `server/src/lib/orders/cursor.js`, `server/src/services/order-list.js`, checkout/order routes/controllers; `client/src/hooks/use-order-page.js`, services checkout/order, `order-history.jsx`, `order-workflow.jsx`, `checkout-order-panel.jsx` và tùy chọn DataTable.

## Google và tài khoản đã kết nối

Cấu hình server dùng Google provider chính thức của Better Auth. Frontend gọi `signIn.social()`/`linkSocial()` bằng redirect; không nhận danh tính từ payload frontend, tắt direct ID-token sign-in/link cho luồng này. State, PKCE S256, cookie và xác minh token/provider do Better Auth xử lý. Không nâng cấp dependency trong Phase 3. Xem [tài liệu users/accounts đúng tag v1.7.11](https://github.com/better-auth/better-auth/blob/v1.7.11/docs/content/docs/concepts/users-accounts.mdx).

`accountLinking.disableImplicitLinking=true`, `requireLocalEmailVerified=true`, không trusted-provider bypass, không cho email khác nhau hoặc unlink toàn bộ. Email Google phải được provider xác minh, bao gồm cả lần đăng nhập lại. Cùng email với tài khoản nội bộ không tự liên kết; lỗi hướng dẫn đăng nhập bằng phương thức hiện có rồi liên kết rõ ràng.

Link cần phiên vừa đăng nhập trong **5 phút**, local email đã verified. Callback kiểm lại phiên còn sống, còn mới, cùng user và cùng email hiện tại; đổi user/email, logout hoặc hết hạn giữa chừng đều bị từ chối. Thời hạn này chỉ áp cho nghiệp vụ link/unlink, không đổi freshness của các chức năng bảo mật khác.

Trang `/settings/connections` hiển thị provider thật, xác minh lại bằng đăng nhập mật khẩu hiện tại hoặc Google với tài khoản chỉ có Google. Google là phương thức cuối cùng thì nút gỡ bị tắt; khách có thể dùng luồng quên mật khẩu hiện hữu để thiết lập credential trước. Server vẫn kiểm lại mọi điều kiện.

HTTP `POST /auth/unlink-account` nhận `{accountId}` duy nhất, có auth/CSRF/origin/rate limit. Service khóa user và kiểm phương thức còn lại trong cùng transaction trước DELETE. Chỉ credential có password gắn đúng user hoặc Google có subject và provider đang cấu hình mới được tính là phương thức còn dùng được. Hook chặn gọi native unlink trực tiếp để tránh bỏ qua khóa/phép kiểm này. Không trả token/password ra DTO hoặc log.

`GET /auth/providers` chỉ trả trạng thái cấu hình Google, không trả client secret. Thiếu credentials thì không đăng ký provider, UI báo chưa cấu hình. `/auth/error` chỉ ánh xạ mã lỗi đã biết; không render error_description hoặc payload nhạy cảm do provider gửi. Sign-in/signup đều có Google khi được bật.

File chính: `server/src/lib/auth/google.js`, auth options/route, `services/connected-accounts.js`, auth-schema index; frontend `social-form.jsx`, sign-in/signup, `connections-page.jsx`, `lib/auth/oauth.js`, trang lỗi auth và env example.

## Cấu hình Google

1. Tạo OAuth client loại Web application trong Google Cloud, hoàn thiện consent screen/test users theo môi trường.
2. Khai báo server-only `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` như `server/.env.example`. Không đặt secret vào biến VITE_* hoặc frontend.
3. Cấu hình `VITE_PUBLIC_CLIENT_URL` là origin frontend, `VITE_PUBLIC_SERVER_URL` là origin backend và `BETTER_AUTH_URL=<backend origin>/auth`. Dùng hai custom subdomain chung domain cha để auth cookie same-site.
4. Authorized redirect URI phải khớp chính xác `<backend origin>/auth/callback/google`. Ví dụ local `http://127.0.0.1:5172/auth/callback/google`; production dùng API origin HTTPS thực. Callback sau login/link nằm cùng origin đã tin cậy.
5. Khởi động lại/deploy server sau khi đổi env. Kiểm `GET <backend origin>/auth/providers`, sau đó kiểm chứng Google thật: đăng nhập mới/cũ, cùng-email conflict, link, unlink, từ chối consent, lỗi callback/state và session đổi/hết hạn. Hiện chưa đánh dấu các bước Google thật này đã qua.

## Tests và regression

| Kiểm tra | Kết quả |
| --- | --- |
| `deno task test` | Client **24 passed**; server **106 passed / 49 opt-in skipped** |
| `deno task test:postgres` | **45 passed**: 36 regression Phase 1–2/checkout + 8 Phase 3 + 1 Better Auth registration/OTP/login/session trên PostgreSQL tạm |
| Google OAuth unit/integration cục bộ | 10 test với Better Auth và memory adapter, Google adapter mô phỏng; state/PKCE, verified email, conflict, link, logout/session change, last-method bypass và lỗi callback |
| `deno task test:e2e` | Admin/upload/cart/statistics/catalog/6 checkout scenarios cũ; thêm Google UI/config/error, reauth/link/unlink, last method và hai luồng phân trang/refresh sau trạng thái |
| `deno task build` | Client/server PASS |
| Server lint; ESLint JS/JSX trong phạm vi Phase 3 | PASS |
| `deno task --cwd server db:check` | PASS |
| Root lint | 2103 lỗi/32 warnings cũ ngoài phạm vi còn lại; không tắt rule hoặc mở rộng Phase 6 |

Runner PostgreSQL luôn tự tạo URL localhost, chạy tất cả migration ở cluster tạm rồi xóa cluster. Cờ auth/checkout cloud chỉ được bật trong process con với URL do runner tạo; Google credentials trong test là fixture, mailer/provider được mock, không gọi Google/SMTP/bucket thật. `test:postgres` cũng kiểm chứng hai script audit chạy transaction READ ONLY.

## Audit và migration

Audit chỉ đọc trên database đang cấu hình đã hoàn thành: READ ONLY `on`, **0 nhóm account trùng provider/subject**, **0 orphan**, **0 credential sai mapping/password null**; hiện chỉ có provider credential. Không thay dữ liệu hoặc lịch sử migration. Audit không in password/token/secret; dùng `deno task audit:phase3` để kiểm lại trước apply.

Migration `server/src/database/migrations-v2/20261021114844_phase3_orders_oauth/migration.sql` chỉ thêm:

- Unique index `account(provider_id,account_id)` để một subject không có hai chủ sở hữu.
- Index `sales_order(user_id,created_at,id)` và `(created_at,id)` phục vụ keyset.

Không đổi kiểu khóa, xóa/gộp account, re-encrypt dữ liệu cũ hoặc sửa chứng từ. Nếu audit phát hiện duplicate/orphan thì dừng để xử lý có quyết định/audit; không tự xóa bản ghi để ép unique index qua.

Database hiện tại có history đến `20261021014954_blushing_marauders`; migration Phase 1 và 2 cũng còn pending theo audit. Vì vậy `db:migrate` sau khi được duyệt sẽ chạy theo thứ tự **Phase 1 → Phase 2 → Phase 3**, không chỉ thêm index Phase 3. Cần phê duyệt cụ thể phạm vi cả ba migration trên database đích trước apply. Không dùng lại phê duyệt migration cũ, không chạy migration trong build/request, không db:push/reset. Rollback giữ bảng/index/dữ liệu mới và chọn deployment tương thích; không quay lại catalog public làm lộ trường nội bộ.
