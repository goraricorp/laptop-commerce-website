# Phase 5 — Admin, hỗ trợ và tính năng tài khoản

Trạng thái: **DONE code/nghiệm thu local**, **PARTIAL rollout**. Migration, Google/SMTP/bucket riêng tư/scheduler/deployment thật chưa được nghiệm thu; các phần tích hợp thật **BLOCKED** cho đến khi cấu hình và phạm vi ghi được phê duyệt. Không áp dụng phê duyệt migration cũ cho migration mới. Không thay đổi secret hoặc thư mục legacy.

## Tiêu chí và bằng chứng

| Phần | Hành vi đã triển khai | Kiểm chứng |
| --- | --- | --- |
| Quan hệ admin | Picker tìm kiếm, phân trang và nhãn thật; SKU có mã, giá trị thông số có tên nhóm; kho tồn chỉ chọn kho hoạt động; người nhận master phải là admin/master đã xác minh, khác người bàn giao | Hono/PostgreSQL authorization, browser chọn danh mục và product-media |
| Product editor | Một PUT lưu product/SKU/attribute values/media/content/thứ tự và adjustment kho trong transaction; request ID/hash cho retry; expectedVersion phát hiện form cũ, mutation catalog con tăng version cha | PostgreSQL hai request sửa cạnh tranh, replay, stock conflict rollback; browser upload/save/409 |
| Thông tin sản phẩm | productType chỉ đọc từ danh mục; HTML qua sanitizer chung; SKU bị gỡ chuyển discontinued, product bị xóa chuyển archived; giữ chứng từ và tồn/ledger cũ | Regression catalog/public DTO, PostgreSQL giữ SKU; UI thông số/content/sắp xếp/kho |
| Ảnh | URL hidden, preview/upload/cancel/toast; manifest attach trong transaction, cleanup sau commit; không lấy pending của người khác hoặc ảnh support làm ảnh công khai | Regression upload/save lỗi/cancel; PostgreSQL profile/product/support references |
| Favorites | Unique user/product; chỉ hiển thị product public; trang `/user/favorites`, nút tại chi tiết, phân trang và xóa của chính mình | PostgreSQL concurrent insert/ownership/draft; browser thêm/xóa |
| Comparison | Tối đa 4 SKU cùng productType, không trùng/ẩn; localStorage chỉ giữ ID, API tải lại giá/thông số/availability | PostgreSQL invalid/mixed/hidden SKU; client test storage hỏng/snapshot cũ; browser bảng so sánh |
| Newsletter | Consent explicit, pending trước double opt-in; token 256 bit hash SHA-256, purpose/generation/expiry/usedAt; outbox chứa token mã hóa bằng secret, không chứa token rõ | PostgreSQL sai purpose/hết hạn/link cũ/confirm cạnh tranh/unsubscribe/replay; email adapter mock và browser xác nhận bằng POST |
| Preferences | DB default transactional=true, marketing=false; worker đơn hàng kiểm transactional trước gửi; email xác minh/khôi phục bảo mật không bị preference chặn | PostgreSQL defaults/ownership/save; browser lưu form; regression mailer/job |
| Support | Conversation/message thật; khách là owner, nhân viên phải được phân công; claim hoặc master phân công lại; open/pending(đã trả lời)/closed; cursor message và polling | PostgreSQL IDOR/assignment/retry/closed/cursor sai; browser tạo phiếu/gửi/poll/đóng |
| Ảnh hỗ trợ | `purpose=support`, chỉ ảnh PNG/JPEG/WebP do người gửi upload; pending chỉ uploader xem, attached chỉ owner/nhân viên hiện được phân công còn đúng vai trò; signed URL 60 giây, private/no-store | PostgreSQL GET không phiên/người khác/nhân viên sai vai trò; S3 adapter mocked |
| 2FA | Better Auth 1.7.11 TOTP; chỉ enable sau mã đúng; secret và backup codes mã hóa, recovery code tiêu thụ một lần; không cho trust-device/disable-session bypass | Native Better Auth + PostgreSQL encryption/enrollment/sai mã/backup code đồng thời |
| Google + assurance | Mọi session mới không tự được tin cậy; callback Google của tài khoản bật 2FA có secondFactorAt=null; chỉ verify/get-session/sign-out, business/account/auth mutation bị chặn; frontend chỉ render màn hình xác minh | Google state/PKCE/callback thật trong Better Auth, chỉ provider adapter mocked; PostgreSQL và browser pending gate |
| Reauthentication | Mật khẩu qua verify-password, Google qua OAuth; stamp gắn session. Thay mật khẩu/email, link/unlink, quản lý 2FA, admin mutation và xóa/bàn giao yêu cầu first factor/second factor trong 5 phút | PostgreSQL stale/sai mã/refresh; regression OAuth/unlink cuối cùng; UI reauthentication |
| Hồ sơ | Giữ URL `/auth/update-user` và `/auth/admin/update-user`, Hono lưu ảnh + profile atomic, strict allowlist; username normalize, birthday parse; admin không sửa 2FA hoặc tombstone qua data | Native Hono/PostgreSQL hồ sơ/ảnh/birthday/role/ownership; các flow Better Auth khác giữ nguyên |
| Xóa tài khoản | Chặn đơn/return/refund mở, paid_late chưa xử lý và master chưa bàn giao. Xóa PII, phiên/provider links/2FA/cart/address/favorite/preferences/newsletter; ẩn review và nội dung/attachment support (kể cả staff đã trích dữ liệu) cùng command result; giữ user tombstone và chứng từ | PostgreSQL open order/return, giữ order/return/FK, thu hồi session, master handoff, race favorite/anonymization |
| Chống hồi sinh tài khoản | Lock owner ở personal writes/checkout/return/upload; DB trigger chặn update tombstone hoặc account/session mới tham chiếu user đã ẩn danh | PostgreSQL direct late writes bị từ chối; regression checkout/paid_late vẫn ghi tiền cho tombstone khi cần đối soát |

Native CRUD chat cũ trả 410 và hướng sang `/staff/support`; không có chatbot hoặc trả lời AI giả. Queue chưa phân công chỉ cung cấp metadata và tiêu đề thay thế, không lộ nội dung riêng tư trước khi nhận xử lý. Các cuộc hội thoại legacy thiếu owner không được tự suy đoán để công khai.

## API và giao diện

Frontend dùng cùng origin `/api`. Write có strict validation/origin guard; mọi actor lấy từ session. Bỏ đường nhập UUID của relation trong form đang hoạt động.

| API | Quyền và ý nghĩa |
| --- | --- |
| `GET /admin/pickers/:resource[/:id]` | Admin/master; q/page/limit, productId/attributeId/staffOnly/masterEligible/excludeId; allowlist DTO; không cho picker đọc chat riêng |
| `GET /admin/product-editor/:id`, `PUT /admin/product-editor/:id` | Admin/master; payload requestId/expectedVersion/product/variants/media/content/inventory |
| `GET /me/favorites`, `GET/PUT/DELETE /me/favorites/:productId` | Chính chủ; PUT rỗng, không nhận userId |
| `POST /catalog/comparison` | Public; `{variantIds}` lấy DTO công khai |
| `GET/PATCH /me/preferences` | Chính chủ; transactional/marketing boolean |
| `POST /newsletter/subscribe` | Public có rate limit PostgreSQL theo IP/email; email/consent=true/source; chỉ accepted 202 |
| `POST /newsletter/action` | token/purpose; confirm 24 giờ, unsubscribe 90 ngày; một lần, idempotent replay; GET trang không tự dùng token |
| `GET/POST /me/support` | List/create của owner, page/limit |
| `GET /me/support/:id`, `GET/POST .../messages`, `POST .../status` | Owner hoặc staff đúng phân công; message requestId/content/attachments; cursor after hoặc before là ID message thuộc phiếu |
| `GET /staff/support`, `GET .../:id`, `GET/POST .../:id/messages`, `POST .../:id/status` | Moderator/admin/master; queue mine/unassigned/all; nội dung chỉ staff được giao |
| `POST /staff/support/:id/assign` | Staff tự nhận phiếu chưa được giao; master được phân công lại với assigneeId hợp lệ |
| `POST /storage/upload?purpose=support` | Ảnh riêng tư; lifecycle và giới hạn 4.000.000 byte giữ nguyên |
| `POST /auth/update-user`, `POST /auth/admin/update-user` | URL cũ, Hono command mới; own profile hoặc master sửa người dùng; ảnh attach trong cùng transaction |
| Better Auth `/auth/two-factor/*`, `/auth/verify-password` | Native plugin/API + assurance hooks; không custom thuật toán TOTP production |
| `POST /me/account/transfer-master` | Master vừa xác minh; successorId là admin/master verified; thu hồi phiên của người nhận, audit |
| `POST /me/account/delete` | Chính chủ vừa xác minh, confirmEmail; không hard delete user |

Trang mới: `/comparison`, `/newsletter`, `/user/favorites`, `/auth/two-factor`. Trang cập nhật: product detail, contact, admin chat/product editor/user editor, notification/security/user info. Các query tài khoản, support, favorites, preferences được gắn owner để không hiển thị cache tài khoản trước.

Không lưu token/secret/TOTP/recovery code ở localStorage; backup codes chỉ hiển thị trong bộ nhớ trang. Khóa TOTP có thể nhập thủ công vào ứng dụng xác thực. Không gửi URI sang dịch vụ QR bên ngoài.

## Schema và rollout

Ba migration Phase 5 mới, chưa áp dụng cloud:

1. `20261021160233_phase5_accounts_support_editor`: favorite, preferences, newsletter/token, audit, catalog_write/support_command; conversation owner/assignee, product version; native two_factor, user flags và session assurance.
2. `20261021162135_phase5_private_support_assets`: phân biệt general/support trong upload_asset, mặc định general cho ảnh cũ.
3. `20261021162726_phase5_support_indexes`: index owner/assignee + thời gian cho queue, cùng trigger bảo vệ user tombstone và late account/session creation. Trigger là DDL chủ động trong migration, không có trong snapshot Drizzle dạng bảng.

Campaign/reference ảnh đã có ở Phase 2; Phase 5 tái sử dụng, không tạo bảng campaign thứ hai. Product version bắt đầu 0. Session cũ không có second-factor stamp; tài khoản đã bật 2FA phải verify lại. Conversation legacy không có owner vẫn giữ nguyên để xử lý bằng nghiệp vụ có kiểm tra.

Trước rollout, từ root chạy `deno task audit:phase5` (transaction REPEATABLE READ READ ONLY), đối chiếu migration history/schema thực tế và kết quả Phase 1–4. Audit cloud ngày 21/10/2026: READ ONLY, chưa có bảng/cột Phase 5, 0 legacy support và 0 orphan account; history vẫn kết thúc ở `20261021014954_blushing_marauders`. Không in secret hoặc email trong audit.

Chỉ sau khi được duyệt **database/phạm vi migration mới**, sao lưu và chạy migration theo thứ tự của toàn bộ các pha đang pending. Không db:push/reset/down migration và không migrate tự động khi build/request. Triển khai schema trước code; backup bao gồm dữ liệu mã hóa và secret tương ứng. Kiểm tra trigger/index/FK/DTO, TOTP/cookie/callback ở cùng origin và profile/upload sau rollout. Tắt traffic ghi khi rollback giữa phiên bản chưa có tombstone guards; không rollback public catalog về phiên bản lộ dữ liệu.

Storage phục vụ support phải chặn anonymous GetObject ở bucket, dù tên bucket cấu hình hiện là `public`. Chỉ backend tạo signed URL; kiểm tra policy thật trước bật attachment production. Scheduler ngoài phải tiếp tục gọi job dispatch mỗi phút và cleanup ảnh hàng giờ; confirmation/unsubscribe email dùng outbox Phase 4, SMTP là at least once. Giữ ổn định BETTER_AUTH_SECRET; cần kế hoạch re-encrypt/outbox pending khi xoay khóa. Không coi việc tạo outbox là đã gửi email thật.

Tombstone giữ ID/FK, audit actor và snapshot chứng từ order/payment/return/refund cần thiết. Không đặt thời hạn lưu chứng từ pháp lý khi cửa hàng chưa có chính sách. Thao tác provider paid_late vẫn phải ghi nhận tiền và đối soát sau ẩn danh; không chặn webhook vì user đã xóa.

## Kiểm thử và giới hạn

- `deno task test`: client **26 passed**, server **116 passed / 95 opt-in skipped**; 17 ca PostgreSQL Phase 5 được skip mặc định để không đụng cloud.
- `deno task test:postgres`: **91 passed** trên PostgreSQL 17 tạm: 17 Phase 5 và 74 regression Phase 1–4/native auth/checkout. Runner luôn tạo localhost cluster, áp dụng toàn bộ migration (kể cả trigger), kiểm tra audit READ ONLY rồi dọn cluster; không đọc DATABASE_URL cloud để chọn đích.
- `deno task test:e2e`: **6 suites** admin-parity, checkout, catalog, phase3, phase4, phase5; mọi API browser mock, không bucket/email/payment thật.
- Root build client/server, migration check, server lint và lint client thay đổi PASS. Root lint vẫn **2103 errors / 32 warnings** tồn tại ngoài phạm vi Phase 5; không tắt rule để che.
- Google provider adapter, SMTP và S3 được mock trong test. Native Better Auth, session cookies, PostgreSQL row locks/constraints/transactions/trigger chạy thật. Browser enrollment dùng mã fixture; tính đúng của TOTP được kiểm với native plugin trên PostgreSQL bằng mã RFC6238 độc lập.
- Chưa chạy migration cloud hoặc kiểm thử ghi cloud, gửi email, upload support, scheduler hay deployment thật. Google credentials thật vẫn chưa được cấu hình/nghiệm thu. Các điều kiện này giữ **PARTIAL/BLOCKED rollout**, không gọi là production-ready.

Phase 6 vẫn TODO và cần phê duyệt riêng. Những thay đổi ở Phase 1–4 chỉ là tích hợp bắt buộc: owner lock chống race với anonymization, guard HTTP, profile image transaction, catalog version và outbox newsletter/preferences.
