# Hoàn thiện Laptop Commerce trên Vercel Express + React/Vite

## 1. Mục tiêu, quyết định và baseline

Hoàn thiện chức năng legacy hữu ích, các tính năng mới trong yêu cầu và tính nhất quán frontend–backend–database. Chatbot, bảo hành, sửa chữa, loyalty và thuế trong schema dự thảo nằm ngoài phạm vi.

Các quyết định đã chốt:

- Giữ **Deno 2.9.7** cho workspace, quản lý dependency và lệnh chạy từ root.
- Theo yêu cầu cập nhật Phase 6, backend dùng **Express 5** trên Vercel Node 24 Functions, vẫn **Vite SSR build**; frontend giữ React/Vite/TanStack. Lựa chọn Hono của Phase 0A được thay thế. Client/server có lệnh dev/build/test/lint riêng, **không dùng Turbo**. [Express trên Vercel](https://vercel.com/docs/frameworks/backend/express).
- Dùng scheduler HTTPS bên ngoài gọi job có xác thực; không phụ thuộc timer sống trong serverless. Vercel Hobby không đáp ứng đối soát mỗi phút bằng Cron tích hợp. [Giới hạn Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing).
- Upload ảnh qua backend, tối đa **4.000.000 byte/file**, chỉ PNG/JPG/JPEG/WebP; giữ tên UUID và lifecycle ảnh hiện có. Giới hạn này chừa khoảng trống cho multipart dưới giới hạn request của Vercel. [Giới hạn payload](https://vercel.com/docs/functions/limitations).
- Giữ mailer SMTP hiện tại; Google OAuth và payment sandbox cấu hình bằng biến môi trường.
- Trả hàng từng phần trong **15 ngày từ khi giao thành công**, admin duyệt và kiểm hàng.
- Khách chỉ tự hủy đơn chưa thanh toán như hiện tại. Đơn đã thanh toán do admin xử lý qua hồ sơ hoàn tiền có lý do.
- Hoàn tiền hàng sau giảm giá; mặc định không hoàn phí giao. Admin được hoàn phí giao trong phạm vi đã thu, có ghi lý do.
- Xóa tài khoản theo hướng ẩn danh, giữ chứng từ giao dịch; chặn khi còn nghiệp vụ đang xử lý.
- Form liên hệ trở thành phiếu hỗ trợ thực, khách và nhân viên trao đổi qua polling.
- Test cloud ghi dữ liệu chỉ chạy trên phạm vi được duyệt riêng; không tự dùng database hiện tại để thử migration hoặc concurrency.

**Baseline đã kiểm tra lại trong Phase 0:**

| Kiểm tra                  | Kết quả                                                 |
| ------------------------- | ------------------------------------------------------- |
| Client tests              | 15 passed                                               |
| Server tests              | 65 passed, 14 cloud tests skipped                       |
| Build riêng client/server | Thành công                                              |
| Root build                | Lỗi `turbo: command not found`                          |
| Lint `server/src`         | 0 lỗi                                                   |
| Lint `client/src`         | 804 lỗi, 3 warnings                                     |
| Git                       | 882 mục thay đổi; cần bảo toàn toàn bộ thay đổi hiện có |

Chưa chạy thanh toán, hoàn tiền, gửi email thật, migration hoặc test cloud trong giai đoạn lập kế hoạch.

## Tiến độ cập nhật 22/10/2026 — Phase 1 đến Phase 6

Yêu cầu mới nhất duyệt Phase 6 và chuyển backend về Express; Phase 1–5 đã có code/local acceptance ở các đợt trước. Code Phase 6 và nghiệm thu local đã hoàn tất. Ngày 22/10/2026 đã áp dụng 9 migration Phase 1–6 lên cloud theo phê duyệt, đối chiếu schema và kiểm tra API đọc; deployment và tích hợp ngoài hệ thống còn pending. [Bằng chứng cloud](CLOUD-MIGRATION-2026-10-22.md). Ban đầu chỉ có `docs/implementation.md`; `docs/implementation-plan.md` hiện trỏ tới tài liệu này để giữ một kế hoạch chính.

| Pha | Code và nghiệm thu local | Rollout |
| --- | --- | --- |
| Phase 1 | **DONE**: public DTO/admin namespace, strict validation, stock ledger/idempotency/transfer/reconciliation, checkout integration; PostgreSQL thật chứng minh concurrency | **PARTIAL**: migration đã áp dụng Neon; chưa kiểm thử ghi nghiệp vụ cloud/deploy |
| Phase 2 | **DONE**: SQL filter/sort/page/facets, cùng SKU, URL state, thông số/media/content thật, HTML sanitize, campaign/spotlight và UI | **PARTIAL**: migration đã áp dụng Neon; chưa deploy |
| Phase 3 | **DONE code/local**: keyset đơn khách/admin, đọc đơn legacy, Google login/link/unlink an toàn; **BLOCKED** kiểm chứng Google thật do thiếu credentials | **PARTIAL**: migration index đã áp dụng cloud; chưa deploy |
| Phase 4 | **DONE code/local**: shipment commands/events, xuất kho ở bàn giao, partial return 15 ngày, allocation/refund/inbox/outbox/jobs, dashboard và collected/refunded/net | **PARTIAL**: 2 migration đã áp dụng cloud; **BLOCKED** nghiệm thu provider/SMTP/scheduler/Vercel thật |
| Phase 5 | **DONE code/local**: picker/product editor transaction/version, favorites/comparison/newsletter/preferences, support/ảnh riêng tư, native TOTP/session assurance, profile và anonymization/master handoff | **PARTIAL**: 3 migration đã áp dụng cloud; **BLOCKED** Google/SMTP/bucket riêng tư/scheduler/deployment thật |
| Phase 6 | **DONE code/local**: Express 5 native, middleware đầy đủ, Vite/Vercel artifact entry, chạy client/server riêng, CI/runbook, archive import graph, lint 0 lỗi/0 warning | **PARTIAL**: migration http_session và các migration trước đã áp dụng cloud, API đọc PASS; **BLOCKED** nghiệm thu nghiệp vụ ghi/provider/deployment thật |

Bằng chứng đợt Phase 1–2 trước đây: client **22 tests passed**, server **94 passed / 41 opt-in skipped**; PostgreSQL 17 localhost **36 passed** (19 Phase 1, 8 Phase 2, 9 checkout regression). Build client/server, browser regression, migration check, server lint và lint các file client thuộc đợt này đã qua. Root lint còn lỗi cũ ngoài phạm vi, tiếp tục xử lý ở Phase 6; không tắt rule hoặc loại source đang dùng.

Xem [báo cáo Phase 1–2, API, thay đổi schema, phạm vi kiểm thử và migration runbook](PHASE-1-2-CATALOG-INVENTORY.md). Không chạy migration, test ghi cloud, bucket, email hoặc payment thật trong đợt Phase 1–2. Hai migration cần phê duyệt database/phạm vi riêng trước rollout; phê duyệt migration cũ không được tái sử dụng.

Cập nhật Phase 3: client **24 passed**, server **106 passed / 49 skipped**; PostgreSQL localhost **45 passed**, browser regression/build/lint phần thay đổi qua. Audit cloud chỉ đọc không có account trùng/orphan, không sửa dữ liệu. Google hiện chưa cấu hình client ID/secret nên kiểm chứng Google thật **BLOCKED**; migration Phase 3 chưa áp dụng. Xem [báo cáo Phase 3](PHASE-3-ORDERS-GOOGLE.md).

Cập nhật Phase 4: client **24 passed**, server **116 passed / 78 opt-in skipped**; PostgreSQL localhost **74 passed** (28 Phase 4, 10 checkout và regression còn lại); 5 browser suites, build, migration check, server lint và lint client trong phạm vi PASS. Root lint vẫn **2103 errors / 32 warnings** cũ. Audit Phase 4 cloud chỉ đọc: không phát hiện chứng từ/shipments/collections bất nhất, chưa có bảng Phase 4. Không apply migration hay chạy giao dịch provider/SMTP/S3 thật; rollout và sandbox thật cần phạm vi được duyệt. Xem [báo cáo, API, schema, bằng chứng và runbook Phase 4](PHASE-4-FULFILLMENT-RETURNS-JOBS.md).

Cập nhật Phase 5: client **26 passed**, server **116 passed / 95 opt-in skipped**; PostgreSQL localhost **91 passed** (17 Phase 5 + 74 regression), **6 browser suites**, build client/server, migration check, server lint và lint client thay đổi PASS. Root lint vẫn **2103 errors / 32 warnings** ngoài phạm vi. Audit cloud READ ONLY xác nhận chưa có schema Phase 5, 0 orphan account/legacy support; không apply migration hoặc gọi SMTP/bucket/provider thật. [Báo cáo Phase 5, tiêu chí nghiệm thu, API/schema và runbook](PHASE-5-ADMIN-ACCOUNTS-SUPPORT.md).

Cập nhật Phase 6: **26 client tests**, **124 server tests / 98 opt-in skipped**, **94 PostgreSQL tạm tests** qua Express, **6 browser suites PASS**; lint client/server **0 errors/0 warnings**, build Vite riêng hai app và migration check PASS. Node **24.21.0** thật đã nạp API Vercel → artifact Vite → Express và kiểm HTTP/Helmet/CORS/JSON/auth. Frozen install PASS. Audit cloud READ ONLY: 0 balance vi phạm/0 review trùng, journal/schema Phase 1–6 vẫn pending; không apply hoặc giao dịch thật. [Báo cáo Phase 6 và runbook](PHASE-6-EXPRESS-VERCEL.md).

Cập nhật cloud 22/10/2026 sau phê duyệt: **9 migration mới đã áp dụng**, history đủ 13/hash khớp; **61 bảng/512 cột, 51 index, 190 constraint, 3 trigger** khớp metadata snapshot, tồn kho trước/sau không đổi. **17 HTTP checks** qua Vite/Express → cloud READ ONLY và Better Auth native user/session lookup PASS. Không thử đăng nhập thật, ghi fixtures hoặc gọi provider. Các ghi chú pending trong báo cáo từng pha phía trên là lịch sử trước đợt apply này. [Chi tiết và giới hạn](CLOUD-MIGRATION-2026-10-22.md).

## 2. Feature parity matrix và vấn đề đã xác minh

`DONE` dưới đây là phần đã có và được kiểm tra cục bộ; không đồng nghĩa đã nghiệm thu production.

| Chức năng                         | Đối chiếu hiện tại                                          | Trạng thái | Hướng hoàn thiện / module chính                                      | Pha   |
| --------------------------------- | ----------------------------------------------------------- | ---------- | -------------------------------------------------------------------- | ----- |
| Đăng ký, xác minh email, mật khẩu | Đã chuyển sang Better Auth                                  | DONE       | Giữ luồng; regression native Express/Better Auth đã qua                        | 0A, 3 |
| Google login                      | Đã có code login/link/unlink và tests; thiếu credentials để kiểm chứng Google thật | BLOCKED       | Social form, auth options, connected accounts                        | 3     |
| Hồ sơ, địa chỉ                    | Có API theo chủ sở hữu                                      | DONE       | Giữ ownership, ảnh và validation                                     | 0A, 5 |
| Vô hiệu hóa/xóa tài khoản         | Anonymization, fresh auth/2FA, open business guard, master handoff; giữ transaction snapshots | DONE local    | Xác minh lại, ẩn danh, thu hồi phiên; giữ dữ liệu giao dịch          | 5     |
| Catalog công khai                 | DTO allowlist, ẩn draft/giá vốn/quan hệ riêng; admin namespace riêng | DONE    | DTO công khai và API admin riêng                                     | 1     |
| Thông số, mô tả sản phẩm          | Attributes/media theo SKU, content thật và HTML sanitize | DONE    | Attributes, SKU, content sections, product page                      | 2     |
| Tìm kiếm, lọc, sắp xếp            | SQL filters/sort/page/facets, cùng SKU; URL khôi phục | DONE    | SQL filtering, SKU matching, URL state                               | 2     |
| Giỏ tài khoản, tăng giảm nhanh    | Đã có DB cart và delta API                                  | DONE       | Giữ merge, ownership, tuần tự hóa và regression                      | 1, 6  |
| Voucher checkout                  | Có chọn mã thật và hoàn lượt khi hủy                        | DONE       | Giữ tính đúng một lần; phân biệt hủy với trả hàng                    | 4, 6  |
| Checkout, thanh toán, dọn giỏ     | Đã có luồng server và idempotency                           | DONE       | Giữ nghiệp vụ, regression qua Express và Vite/Node artifact               | 0A, 4 |
| Review khách hàng                 | Có sửa/xóa, unique, summary thật                            | DONE       | Giữ ownership/moderation; kiểm tra public review không lộ dữ liệu ẩn | 1, 6  |
| Thống kê admin                    | SQL, phân trang/chi tiết; tiền đã thu, đã hoàn và doanh thu ròng | DONE       | Giữ collected/refunded/net và regression                | 4, 6  |
| Lịch sử khách, admin workflow     | Keyset/asOf, tổng/search/status SQL, gồm đơn legacy theo chủ sở hữu | DONE    | Phân trang ổn định, tìm kiếm, lọc trạng thái                         | 3     |
| Admin CRUD/upload                 | Picker, product aggregate transaction/version, inventory ledger, ảnh và profile atomic | DONE local    | Picker, workflow sản phẩm hoàn chỉnh, validation server              | 5     |
| Kho nhiều địa điểm                | Ledger chung, khóa/atomic update, operation hash, transfer/reconciliation | DONE    | Ledger, khóa/atomic update, transfer, reconciliation                 | 1     |
| Shipment, return, refund          | Command/event, partial return, refund/idempotency và job; local PASS, live chưa nghiệm thu | PARTIAL    | State machine và nghiệp vụ có lịch sử                                | 4     |
| Favorites, comparison, newsletter | Favorites DB, comparison public SKU, newsletter consent/token/outbox; SMTP thật pending | DONE local       | Dữ liệu thật, API, trang quản lý, consent                            | 5     |
| 2FA, notification preferences     | Native TOTP/encrypted recovery, Google pending assurance, preferences DB | DONE local       | Better Auth TOTP, session assurance, preferences DB                  | 5     |
| Banner, spotlight, liên hệ        | Campaign/spotlight thật; support owner/assigned staff, polling, private attachments | DONE local    | Campaign, chỉ số thật, phiếu hỗ trợ                                  | 2, 5  |
| Root tooling/deployment           | Deno tasks chạy riêng, Express/Vite artifact, 2 Vercel config, CI/runbook, lint sạch | DONE local / PARTIAL live | Nghiệm thu Vercel và tích hợp thật theo phạm vi được duyệt | 0A, 6 |

Dùng `server/src/database/schema.js` làm nguồn schema đang chạy. Không chuyển wholesale sang `schema-new`, vì bản dự thảo khác cả kiểu khóa và cấu trúc quan hệ. Cập nhật matrix và bằng chứng kiểm thử trong `docs/LEGACY-PARITY.md` sau từng pha.

## 3. Kế hoạch triển khai theo pha

### Phase 0A — Nền tảng Hono, Deno và serverless (lịch sử)

Nội dung dưới đây ghi lại lựa chọn và nghiệm thu Phase 0A trước đây. Phase 6 đã thay HTTP runtime bằng Express 5; dùng [runbook Phase 6](PHASE-6-EXPRESS-VERCEL.md) để chạy/deploy hiện tại.

- Tạo Deno workspace root cho client/server; hợp nhất lockfile theo phiên bản đang resolve, không nâng cấp thư viện hàng loạt.
- Thay orchestration Turbo chưa hoàn chỉnh bằng Deno tasks. Root có `dev`, `build`, `lint`, `test`, `test:integration`, `test:e2e`, `check`.
- Port routes, controllers và middleware HTTP sang Hono; giữ services/transaction nghiệp vụ. Chuẩn hóa imports để chạy được ngoài Vite SSR.
- Mount Better Auth bằng Web `Request/Response`; giữ base path `/auth`, cookie, CSRF, role và ownership. [Tích hợp Hono của Better Auth](https://better-auth.com/docs/integrations/hono).
- Giữ nguyên đường dẫn và response của API đang hoạt động, trừ những thay đổi được xác định rõ ở các pha sau.
- Đổi multipart sang parser Hono có giới hạn kích thước; giữ nguyên kiểm tra chữ ký ảnh và lifecycle.
- Đọc raw body webhook trước mọi bước parse; giữ kiểm tra Stripe/MoMo/ZaloPay.
- Frontend gọi `/api`; Vite proxy khi local và Vercel rewrite khi deploy để auth dùng cookie cùng origin. Google callback dùng URL công khai tương ứng.
- Pool PostgreSQL dùng lại theo instance, có giới hạn connection; bỏ cleanup timer khỏi đường khởi tạo app serverless.
- Rate limit upload/checkout dùng storage chung PostgreSQL, không dùng bộ đếm riêng từng instance.
- Cấu hình hai Vercel project và tài liệu biến môi trường mẫu; không sửa file secret hiện có.

**Nghiệm thu:** root chạy được install/dev/build/test; API contract, cookie, upload và webhook regression qua Hono; không mất các luồng đã hoạt động.

### Phase 1 — Bảo mật catalog và tính toàn vẹn tồn kho

**Tiến độ:** DONE code/local acceptance; PARTIAL rollout. Migration `20261021032042_phase1_catalog_inventory` chưa áp dụng cloud. [Bằng chứng](PHASE-1-2-CATALOG-INVENTORY.md).

**Catalog và authorization**

- Giữ các URL catalog hiện tại cho public reads, nhưng chỉ trả DTO allowlist; chuyển đầy đủ quản trị sang `/admin/catalog/*`.
- Public chỉ có sản phẩm/biến thể được mở bán, quan hệ hợp lệ và nội dung công khai; không có `costPrice`, metadata nội bộ hoặc dữ liệu draft qua ID trực tiếp.
- Tách dữ liệu giá vốn, tồn theo kho và trường nội bộ cho admin/master.
- Kiểm tra tương tự với review, media, nội dung và các endpoint quan hệ.
- Dùng Zod strict ở backend cho mọi write trong phạm vi; lỗi validation trả `issues` gắn đường dẫn trường để form hiển thị chính xác.

**Inventory**

- Gom nhập/xuất/điều chỉnh, reserve/release, issue/return vào một service tồn kho dùng chung.
- Tạo dòng balance còn thiếu bằng conflict-safe insert; khóa các dòng theo thứ tự cố định `(locationId, variantId)` và cập nhật có điều kiện.
- Giữ bất biến `0 ≤ reserved ≤ onHand`; không cho xuất/chuyển hàng đã giữ.
- Thêm operation ID duy nhất và request hash. Request lặp trả kết quả cũ; cùng ID nhưng payload khác trả 409.
- `POST /inventory/transfers` thực hiện kiểm tra kho, trừ nguồn, cộng đích và ghi hai movement trong cùng transaction.
- Ghi actor, operation, nguồn nghiệp vụ và before/after; không sửa/xóa ledger.
- Reconciliation so sánh balance, reservation và ledger từ mốc baseline. Chênh lệch tạo báo cáo; sửa bằng adjustment có lý do.
- Chỉ retry transaction cho deadlock/serialization failure với số lần giới hạn; không retry lỗi nghiệp vụ hoặc gọi provider trong transaction.

**Migration:** operation/idempotency, reservation có trạng thái, transfer, audit và baseline đối soát; backfill từ snapshot checkout hiện có, không tự đổi số tồn.

**Nghiệm thu:** không lost update; chỉ một khách mua được hàng cuối; transfer rollback toàn bộ; reserve/release và request lặp không ghi trùng.

### Phase 2 — Trải nghiệm sản phẩm và nội dung thật

**Tiến độ:** DONE code/local acceptance; PARTIAL rollout. Migration `20261021090928_phase2_storefront` chưa áp dụng cloud. Phase 4 đã tích hợp accepted partial return và mốc giao ổn định vào spotlight. [Bằng chứng](PHASE-1-2-CATALOG-INVENTORY.md).

- API catalog lọc/sort/phân trang tại SQL; trả `items`, `total`, `page`, `limit`, facets và SKU khớp đại diện.
- Query hỗ trợ danh mục, hãng, khoảng giá, tìm kiếm và thuộc tính theo mã/ID thực tế.
- **Quy tắc SKU:** OR trong cùng nhóm giá trị; AND giữa các nhóm; một SKU phải đồng thời thỏa toàn bộ điều kiện. Giá hiển thị/sắp xếp là giá thấp nhất trong các SKU khớp, có tie-break bằng ID.
- Public chỉ trả tình trạng khả dụng tổng hợp từ các kho đang hoạt động; backend checkout tiếp tục quyết định cuối cùng.
- URL lưu đầy đủ search/filter/sort/page; đổi bộ lọc đưa về trang đầu.
- Trang chi tiết tải thuộc tính, ảnh và giá của SKU đang chọn; render content sections theo thứ tự admin quản lý.
- Nội dung mặc định là plain text; HTML chỉ ở định dạng được khai báo, sanitize allowlist phía server, không chạy script/embed tùy ý.
- Hoàn thiện Đọc thêm/Thu gọn, loading/error/empty, responsive và điều hướng bàn phím.
- Banner lấy campaign có thời hạn; chỉ hiển thị giảm giá có chương trình thật.
- Spotlight mặc định là “Bán chạy 7 ngày qua”, dựa trên số lượng đã bán hợp lệ, trừ hàng trả; nếu không có dữ liệu thì ẩn khối.
- Gỡ các khẳng định tồn kho, giao nhanh hoặc thông số chưa có nguồn dữ liệu.

**Migration:** index phục vụ query, định dạng content, campaign/banner và tham chiếu ảnh.

**Nghiệm thu:** tìm thấy sản phẩm vượt giới hạn cũ; bộ lọc màu/CPU/RAM hoạt động trên dữ liệu thật; đổi SKU đồng bộ toàn bộ thông tin; không có XSS hoặc số liệu quảng cáo giả.

### Phase 3 — Đơn hàng và Google authentication

**Tiến độ:** DONE code/local acceptance; BLOCKED kiểm chứng Google thật vì thiếu GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; PARTIAL rollout. Migration `20261021114844_phase3_orders_oauth` chưa áp dụng cloud. [API, tests, audit và cấu hình](PHASE-3-ORDERS-GOOGLE.md).

- Phân trang server cho `/me/orders` và admin order workflow; hỗ trợ tìm kiếm, lọc trạng thái và thứ tự ngày tạo.
- Dùng keyset `(createdAt, id)` với mốc `asOf`, tổng số theo bộ lọc và cursor trang; refresh sau thao tác đổi trạng thái.
- Khách chỉ thấy đơn của mình; admin/master xử lý theo quyền hiện tại. Giữ thống kê phân trang đã có.
- Tích hợp Google bằng Better Auth; dùng state/PKCE/token verification của thư viện, không nhận danh tính từ payload frontend.
- Không implicit-link chỉ vì trùng email. Liên kết Google từ phiên đã xác minh lại; email chưa verified không được dùng để gộp tài khoản.
- Hoàn thiện link/unlink tài khoản; không được xóa phương thức đăng nhập cuối cùng.
- Thiếu credentials thì hiển thị trạng thái chưa cấu hình, có tài liệu callback và env mẫu, không giả lập thành công.

**Migration:** chỉ bổ sung constraint/index tài khoản OAuth sau khi kiểm tra dữ liệu hiện hữu.

**Nghiệm thu:** trên 100 đơn vẫn duyệt hết, không trùng trang khi có đơn mới; Google login/link/unlink đúng quyền, callback lỗi và email conflict được xử lý.

### Phase 4 — Fulfillment, trả hàng, hoàn tiền và job nền

**Tiến độ:** DONE code/local acceptance; PARTIAL rollout, 2 migration Phase 4 chưa áp dụng cloud; BLOCKED nghiệm thu provider refund/SMTP/scheduler/Vercel thật chưa được thực hiện trong phạm vi được duyệt. PostgreSQL 74 tests, 5 browser suites và build/regression PASS. [Chi tiết, API và migration/scheduler runbook](PHASE-4-FULFILLMENT-RETURNS-JOBS.md).

- Shipment dùng command nghiệp vụ và event history thay cho CRUD trạng thái tùy ý. Luồng mặc định một chuyến giao toàn đơn; partial return được hỗ trợ.
- Khi bàn giao vận chuyển: chuyển reservation thành xuất kho đúng một lần. Giao thành công phải có event của nhân viên được phân quyền hoặc sự kiện đã xác minh.
- Bổ sung mốc xuất kho/giao hàng để đơn cũ đã completed không bị trừ kho lần nữa.
- Return: `requested → approved/rejected → received → inspected → completed`; cho khách chọn dòng/số lượng còn được trả trong 15 ngày.
- Kiểm hàng ghi rõ lượng được nhập lại, kho nhận, tình trạng và lý do; hàng không đạt không tăng tồn bán được.
- Hoàn tiền theo số thực trả: phân bổ giảm giá xuống dòng/đơn vị, làm tròn VND có bảo toàn tổng; đơn cũ backfill từ tổng đã lưu.
- Refund có `pending/processing/succeeded/failed/needs_review`; số đã hoàn cộng số đang xử lý không vượt số đã thu.
- Adapter refund cho Stripe, MoMo, ZaloPay và PayPal; COD dùng xác nhận hoàn thủ công có chứng từ. Không đánh dấu thành công khi chỉ mới gửi yêu cầu.
- Provider timeout giữ trạng thái chờ đối soát với cùng reference; không tạo một khoản hoàn mới.
- Hủy đơn chưa thanh toán giữ quy tắc hoàn lượt voucher đúng một lần. Trả hàng/hoàn tiền không tự hoàn lượt voucher. Admin xử lý hủy đơn đã trả qua hồ sơ được ghi lý do.
- Webhook inbox lưu event duy nhất, kiểm chữ ký/amount/currency/reference và không cho event cũ đảo ngược kết quả mới.
- Outbox ghi trong transaction; gọi provider/SMTP ngoài transaction, rồi cập nhật kết quả.
- Job `/internal/jobs/*` dùng bearer secret, lease và `SKIP LOCKED`, chạy batch trong thời lượng giới hạn. Scheduler ngoài gọi mỗi phút; cleanup ảnh quét hàng giờ.
- Dashboard vận hành có backlog, lỗi, lần chạy cuối và thao tác đối soát lại; không log token, secret hoặc payload nhạy cảm.
- Thống kê tách tiền đã thu, tiền đã hoàn và doanh thu ròng.

**Migration:** shipment events, stock-issued/delivered timestamps, return/items, refund/attempts, phân bổ giảm giá, webhook inbox, outbox và job lease.

**Nghiệm thu:** shipment–order–payment–inventory nhất quán; partial return đúng lượng/tiền; webhook/job trùng hoặc sai thứ tự không nhân đôi tác động.

### Phase 5 — Admin, hỗ trợ và tính năng tài khoản

**DONE code/nghiệm thu local; PARTIAL rollout.** Chi tiết từng tiêu chí, 17 ca PostgreSQL, browser, migration và điều kiện tích hợp thật tại [báo cáo Phase 5](PHASE-5-ADMIN-ACCOUNTS-SUPPORT.md). Ba migration mới chưa áp dụng cloud; Phase 6 đã nghiệm thu local; rollout vẫn pending như bảng tiến độ phía trên.

- Thay UUID thủ công bằng searchable picker cho quan hệ hợp lệ.
- Product editor quản lý sản phẩm, SKU, thông số, content, ảnh/sắp xếp và kho; lưu quan hệ bằng transaction, có kiểm tra phiên bản để tránh ghi đè chỉnh sửa đồng thời.
- `productType` chỉ đọc, suy ra từ danh mục. Xóa SKU/sản phẩm đã có lịch sử chuyển sang ngừng hoạt động khi cần giữ tham chiếu.
- Giữ hidden URL input, preview, upload/cancel, UUID và toast; mở rộng reference ảnh cho campaign và phiếu hỗ trợ.
- Favorites lưu theo tài khoản, unique user/product; có trang quản lý.
- Comparison so sánh tối đa bốn SKU cùng loại sản phẩm, lưu lựa chọn localStorage; toàn bộ giá/thông số lấy lại từ public API.
- Newsletter lưu consent, dùng double opt-in; trước xác nhận chỉ báo “đã tiếp nhận yêu cầu”. Token xác nhận/hủy được hash, có hạn và dùng đúng mục đích; không triển khai gửi marketing hàng loạt.
- Notification preferences lưu DB; mặc định thông báo giao dịch bật, marketing tắt. Email bảo mật bắt buộc không bị tắt bởi marketing preference.
- Support ticket dùng conversation/message hiện có, kiểm owner hoặc nhân viên được phân công; trạng thái mở/đã trả lời/đóng, polling và attachment theo lifecycle ảnh.
- 2FA dùng Better Auth TOTP và recovery codes mã hóa, chỉ bật sau xác minh. Thao tác nhạy cảm yêu cầu reauthentication và second factor khi đã bật.
- Bổ sung trạng thái xác minh second factor gắn với session để Google callback không bỏ qua 2FA. Phiên pending chỉ được xác minh hoặc đăng xuất, chưa được dùng API nghiệp vụ hay thao tác tài khoản.
- Xóa tài khoản: xác minh lại, kiểm tra đơn/return/refund còn mở, kiểm tra bàn giao master; thu hồi phiên và provider links, xóa dữ liệu cá nhân không cần giữ.
- Giữ user tombstone ẩn danh để bảo toàn FK checkout và audit. Giữ snapshot chứng từ giao dịch; không công bố một thời hạn xóa chứng từ pháp lý khi chưa có chính sách cửa hàng.

**Migration:** favorites, preferences, newsletter/token, campaign, trường hỗ trợ, Better Auth two-factor, session assurance, anonymization và audit.

**Nghiệm thu:** mọi nút trong phạm vi có nghiệp vụ thật; không IDOR, không tự khóa đăng nhập, Google không bypass 2FA; xóa tài khoản không làm mất giao dịch.

### Phase 6 — Tích hợp, chất lượng và nghiệm thu cuối

**DONE code/nghiệm thu local; PARTIAL rollout.** Yêu cầu mới bổ sung Express 5 thay Hono, giữ Vite SSR build và Vercel Node serverless, middleware CORS/Helmet/rate-limit/session PostgreSQL/Multer/cookie/compression và tasks client/server riêng. Chi tiết tiêu chí/API/schema/tests/CI và giới hạn live tại [báo cáo Phase 6](PHASE-6-EXPRESS-VERCEL.md).

- Sửa lint source đang dùng; chỉ loại legacy/archive, generated files và template được chứng minh không được import/route. Không vô hiệu hóa rule để che lỗi.
- Giữ nguyên thư mục legacy. Template không còn dùng được tách khỏi source chạy, không xóa lịch sử người dùng.
- Hoàn thiện root scripts, CI, setup Deno, hai Vercel project, proxy/cookie, OAuth, scheduler, SMTP, bucket và migration runbook.
- Kiểm tra lại toàn bộ matrix, regression checkout và các trạng thái rỗng/lỗi.
- Mỗi tích hợp có bằng chứng riêng: test cục bộ, API mô phỏng, database thật hoặc sandbox thật; không gộp chúng thành một tuyên bố “đã chạy production”.

## 4. Kiểm thử, migration và triển khai an toàn

**Kiểm thử bắt buộc**

- Public/admin authorization: ẩn draft, giá vốn và dữ liệu quan hệ; không bypass bằng ID/query.
- Concurrency PostgreSQL: nhập đồng thời, xuất đồng thời, hai khách mua hàng cuối, checkout cùng adjustment, transfer rollback, request lặp và cancel/release đồng thời.
- Catalog dữ liệu lớn: trên 200 sản phẩm/300 SKU, cùng SKU thỏa toàn bộ filter, giá biên, tổng đúng, URL khôi phục và phân trang ổn định.
- Order/return/refund: giới hạn lượng trả, thời hạn 15 ngày, phân bổ giảm giá, restock sau kiểm hàng, refund timeout/trùng/sai thứ tự và paid-late.
- Auth: OAuth collision, link/unlink cuối cùng, TOTP sai/đúng, recovery dùng một lần, pending Google session và xóa tài khoản còn nghiệp vụ.
- Frontend/E2E: catalog → SKU → giỏ → voucher → checkout → thanh toán sandbox → xử lý/giao → trả/hoàn; admin product editor và upload lỗi/cancel/save.
- 14 cloud tests hiện có gồm auth, checkout và parity; chỉ chạy khi các cờ opt-in và phạm vi fixtures được duyệt. Concurrency phải được chứng minh trên PostgreSQL thật, không kết luận từ mock.

**Migration và rollback**

- Mỗi pha có migration riêng theo hướng thêm bảng/cột trước, backfill có kiểm tra, rồi mới dùng constraint và code mới.
- Kiểm tra schema thực tế, orphan/duplicate và lịch sử migration trước khi apply. Không reset, `db:push` hoặc tự chạy migration trong request/build.
- Chỉ đọc dữ liệu khi audit; apply và test ghi trên cloud hiện tại cần phê duyệt phạm vi cụ thể. Phê duyệt migration cũ không áp dụng cho migration mới.
- Không tự sửa tồn kho hoặc chứng từ cũ khi phát hiện chênh lệch; xuất danh sách để xử lý bằng nghiệp vụ có audit.
- Rollback ưu tiên tắt feature và quay lại deployment tương thích, giữ bảng/dữ liệu mới. Không chạy down migration phá dữ liệu.
- Không rollback public catalog về phiên bản làm lộ dữ liệu. Không coi rollback code là hoàn tác được thanh toán hoặc hoàn tiền ngoài hệ thống.

**Phụ thuộc và cách duyệt**

`Phase 0A → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6`.

Tooling, cấu trúc outbox và kiểm thử nền được tạo sớm ở mức cần thiết; không triển khai đồng thời các thay đổi nghiệp vụ lớn. Sau mỗi pha báo cáo `DONE/PARTIAL/BLOCKED/TODO`, file thay đổi, API/schema, test/build/lint, hạn chế và pha tiếp theo. Chỉ sang pha tiếp theo sau phê duyệt theo quy trình đã yêu cầu.

Google credentials, scheduler ngoài, SMTP, sandbox refund hoặc quyền kiểm thử cloud còn thiếu sẽ được ghi **BLOCKED**, với code kiểm thử được và bước cấu hình cụ thể. Dự án chỉ được nghiệm thu đầy đủ khi các giới hạn đó đã được xử lý hoặc được chấp nhận rõ ràng; build thành công không thay thế kiểm chứng nghiệp vụ.
