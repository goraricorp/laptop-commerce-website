# Tiến độ triển khai theo pha

- Cloud 22/10/2026: **9 migration Phase 1–6 đã áp dụng**, history/schema khớp, API đọc qua Vite/Express và native auth lookup PASS. [Bằng chứng và phạm vi](CLOUD-MIGRATION-2026-10-22.md). Các ghi chú chưa apply trong lịch sử bên dưới thuộc đợt trước.
- Phase 0 audit: DONE (baseline local).
- Hiện tại Phase 6: Express 5/Vite, client-server chạy riêng; lint sạch và regression local DONE. [Báo cáo và rollout](PHASE-6-EXPRESS-VERCEL.md).
- Phase 0A Hono/Deno (lịch sử, đã được Express thay thế): code và kiểm thử local DONE; deployment Vercel và cloud-write verification chưa thực hiện. Xem [báo cáo Phase 0A](PHASE-0A-HONO.md).
- Phase 1: DONE code và local acceptance trên PostgreSQL thật — public DTO/admin riêng, stock ledger/idempotency/transfer/reconciliation; Migration đã áp dụng cloud; PARTIAL rollout vì chưa deploy/nghiệm thu nghiệp vụ ghi thật.
- Phase 2: DONE code và local acceptance — SQL query/facets theo cùng SKU, thông số/media/content thật, campaign/spotlight và URL state; Migration đã áp dụng cloud; PARTIAL rollout vì chưa deploy/nghiệm thu nghiệp vụ ghi thật.
- Phase 3: DONE code/local — keyset/asOf cho lịch sử khách và workflow admin, đọc snapshot legacy và Google login/link/unlink có reauthentication/khóa chống tự khóa đăng nhập. BLOCKED Google thật vì thiếu credentials; Migration index đã áp dụng cloud; PARTIAL rollout vì chưa deploy. Xem [báo cáo Phase 3](PHASE-3-ORDERS-GOOGLE.md).
- Phase 4: DONE code/local — shipment command/events, xuất kho tại bàn giao, partial return 15 ngày, refund/allocation/inbox/outbox/jobs, dashboard và collected/refunded/net; PARTIAL rollout (2 migration đã apply cloud, chưa deploy), BLOCKED nghiệm thu provider/SMTP/scheduler/Vercel thật. Xem [báo cáo Phase 4](PHASE-4-FULFILLMENT-RETURNS-JOBS.md).
- Phase 5: DONE code/local — admin picker/workflow, favorites, comparison, newsletter, support, 2FA, preferences và ẩn danh tài khoản; PARTIAL/BLOCKED rollout và tích hợp thật.
- Phase 6: DONE code/local — Express/Vite, middleware, lint sạch, CI và regression tổng thể; Migration đã apply cloud; PARTIAL/BLOCKED deployment và tích hợp thật.

Các kết quả cloud trong phần dưới là lịch sử kiểm thử trước Phase 0A, không phải kết quả chạy lại sau chuyển Hono rồi Express. Phạm vi migration và kiểm thử ghi cloud mới cần được duyệt theo kế hoạch đã chốt.

Bằng chứng đợt Phase 1–2: client 22 passed; server 94 passed/41 skipped (opt-in); 36 tests trên PostgreSQL 17 localhost; browser API mô phỏng và build client/server qua. Xem [báo cáo và migration runbook](PHASE-1-2-CATALOG-INVENTORY.md). Hai migration mới chưa áp dụng Neon; các kết quả cloud dưới đây chỉ là lịch sử.

# Hoàn thiện chức năng legacy

## Checkout, giỏ và voucher

- Giá, điều kiện voucher, lượt tổng và lượt mỗi tài khoản được kiểm tra trên server trong transaction tạo đơn. Request key đảm bảo retry không tạo đơn/lượt sử dụng thứ hai.
- `GET /me/vouchers` trả voucher và trạng thái thật theo tài khoản: khả dụng, đã dùng hết lượt, sắp có hiệu lực, hết hạn hoặc hết lượt tổng. Checkout có danh sách chọn mã và ô nhập mã.
- Hủy đơn hoặc thanh toán thất bại/hết hạn được gateway xác minh sẽ xóa lượt sử dụng và giảm usedCount đúng một lần. Giao dịch paid_late giữ đơn hủy và yêu cầu đối soát hoàn tiền; không dùng lại voucher đã hoàn lượt.
- Checkout ghi snapshot ID dòng giỏ cùng số lượng mua. COD dọn giỏ trong transaction tạo đơn; online dọn trong transaction ghi nhận paid từ callback, refresh hoặc job đối soát. cartClearedAt và session lock chống dọn hai lần. Không cần sessionStorage hoặc khách quay lại trang. Dòng giỏ đã xóa rồi thêm lại có ID mới nên không bị xóa nhầm.
- Nút cộng/trừ dùng delta nguyên trên API `PATCH /me/cart/items/adjust`, tuần tự hóa theo tài khoản. Hai lần cộng nhanh tăng hai lần. Số lượng giới hạn 1–99; giảm bị tắt tại 1.
- Giỏ khách chỉ lưu dữ liệu sản phẩm API vào localStorage. Khi đăng nhập, gộp theo SKU bằng số lượng lớn hơn để retry không cộng lặp. Không thay dữ liệu thiếu bằng sản phẩm mẫu.

## Review

- API giữ khóa tài khoản khi tạo review, từ chối bản ghi thứ hai cùng user/product bằng 409; unique index ở DB bảo vệ cạnh tranh giữa các request.
- Khách sửa/xóa qua `/me/reviews/:id`, kiểm tra cả ID và chủ sở hữu. Sửa đưa về pending, không cho khách sửa trạng thái hay nhãn đã mua.
- `/review/summary?productId=...` tính điểm trung bình và tổng số review published. Trang sản phẩm dùng số liệu thật; thẻ sản phẩm không còn điểm sao giả.

## Admin và thống kê

- Đã bỏ Faker và dependency trực tiếp, dữ liệu fallback mẫu, hóa đơn/thẻ/kết nối tài khoản giả và thông báo giả khỏi các luồng hoạt động. Không xóa seed hoặc fixture kiểm thử; chúng không được dùng thay dữ liệu thật trong app.
- Bảng admin giữ nguyên dữ liệu/ID từ API, hiển thị trạng thái rỗng khi không có dữ liệu và có phân trang server. Form edit luôn tải lại bản ghi thật, không lấy giá trị từ navigation state.
- Editor không gọi create hook không tồn tại đối với resource không được tạo; giới hạn thao tác theo resource/nghiệp vụ vẫn được giữ.
- `/admin/statistics` tổng hợp SQL trên toàn bộ đơn, lọc ngày Việt Nam (bao gồm ngày kết thúc). Lịch sử có page/limit/search theo mã đơn, tên/email khách, tổng lịch sử riêng; thông tin khách và nút xem chi tiết. Không còn giới hạn lịch sử ở 100 đơn.
- `/admin/statistics/orders/:id` trả items, địa chỉ snapshot, thanh toán, vận chuyển và lịch sử; chỉ admin/master được xem.

## Ảnh trong form create/edit

- Component chung hiển thị ảnh xem trước, Upload, Hủy ảnh mới và Gỡ ảnh (với trường nullable). Ô URL luôn hidden.
- Chấp nhận png/jpg/jpeg/webp, kiểm tra MIME, extension và chữ ký file. Tên trên bucket là UUID random với đuôi tương ứng. File mới là pending, chỉ lưu URL vào entity khi bấm Save.
- Hủy ảnh mới, hủy/rời form, đóng trang và lưu lỗi đều yêu cầu xóa ảnh pending, khôi phục giá trị ảnh trước đó. Toast báo upload/save/cancel thành công hoặc lỗi. Các form admin và hồ sơ dùng chung lifecycle.
- Reference được attach trong transaction lưu entity và khóa dòng upload để cleanup không xóa ảnh đang được lưu. Nếu request Save đã commit nhưng response bị mất, cleanup kiểm tra reference và giữ ảnh đã lưu.
- Thay/xóa ảnh đã lưu đưa object cũ vào hàng đợi dọn. Object còn được bản ghi khác tham chiếu không bị xóa. URL ngoài bucket không bị xóa.
- Manifest upload_asset được giữ sau khi xóa tài khoản để vẫn dọn được object mồ côi. Lỗi bucket giữ manifest để retry.
- Express serverless không khởi chạy timer. Ảnh pending quá 24 giờ vẫn được chọn bởi CLI cleanup; Phase 4 đã có job HTTPS có xác thực/lease, batch/deadline và checked_at để quét xoay vòng; scheduler ngoài vẫn chưa được cấu hình/nghiệm thu thật. Hủy ảnh từ trình duyệt và kiểm tra reference tiếp tục hoạt động. Không coi cleanup tự động là đã triển khai chỉ vì có CLI.

## Migration và kiểm tra

Migration: `src/database/migrations-v2/20261021014954_blushing_marauders/migration.sql`.

Thêm upload_asset, cart_snapshot, cart_cleared_at và unique index review. Review trùng được lưu nguyên bản JSON vào product_review_duplicates_backup trước khi giữ lại một bản ưu tiên published/mới nhất. Không xóa dữ liệu sao lưu. Snapshot giỏ được bổ sung cho đơn online vẫn chờ thanh toán, chỉ đối chiếu các dòng giỏ có trước khi tạo đơn; không tự dọn lại đơn đã thanh toán trong lịch sử.

`node_modules/.bin/drizzle-kit check` kiểm tra cấu trúc migration. Sau khi database đích được duyệt, chạy `node_modules/.bin/drizzle-kit migrate` từ server trước khi triển khai code mới. Migration đã được áp dụng lên database Neon cấu hình sau khi người dùng phê duyệt. Do database trước đó được tạo bằng db:push và history rỗng, script baseline-migrations.mjs đã đối chiếu 35 bảng, 299 cột, enums/index/constraints với snapshot nền rồi ghi nhận ba migration cũ; không chạy lại DDL cũ. Script mặc định chỉ kiểm tra; --apply chỉ được dùng cho database có history rỗng và schema khớp.

Test unit kiểm tra hoàn lượt, dọn giỏ một lần, delta liên tiếp, quyền review và ảnh, định dạng ảnh, khóa/reference khi cleanup và phân trang thống kê. `tests/browser/admin-parity.mjs` và `tests/browser/checkout.mjs` kiểm tra UI với API giả lập; không gửi giao dịch hay upload lên bucket thật.

Chatbot chưa được tích hợp; giao diện không giả lập câu trả lời AI.

Đã kiểm thử database và bucket thật bằng fixtures UUID riêng: COD/online dọn giỏ đúng một lần, hủy/failed hoàn lượt voucher, cạnh tranh review trùng, upload/đọc/giữ ảnh đã lưu/xóa ảnh mồ côi. Toàn bộ fixture/object tạm được dọn sau kiểm thử. Bucket local được sửa từ uploads (không tồn tại) sang bucket public đã có.

## Nghiệm thu Phase 4 ngày 21/10/2026

- Shipment/payment CRUD trạng thái chuyển sang command nghiệp vụ; raw writes bị bỏ và direct editor chỉ đọc. Giao hàng có actor/event; COD ghi nhận chứng từ thu. Xuất kho ở bàn giao đúng một lần, không trừ thêm lúc completed; đơn cũ được backfill mốc mà không sửa balance.
- Chủ đơn trả từng phần trong 15 ngày; admin duyệt/nhận/kiểm, chỉ restock lượng đủ điều kiện. Giao thất bại nhận lại qua cùng quy trình, COD chưa thu không tạo hoàn tiền giả.
- Phân bổ từ tổng đã lưu bảo toàn VND; chỉ hoàn tiền sau giảm giá, mặc định không hoàn phí giao. Ngân sách giữ cả refund đang chờ/needs_review; timeout query cùng reference. Thất bại dứt điểm cho phép tạo hồ sơ mới có lý do; hủy đã thu/return/refund không hoàn lượt voucher.
- Provider adapters, signed webhook inbox, transactional outbox và job HTTPS có lease/SKIP LOCKED; dashboard có backlog, lỗi, lần chạy cuối và đối soát. SMTP là at least once, Message-ID cố định không thay thế exactly-once delivery.
- Thống kê collected/refunded/net từ các khoản thu/hoàn thực; spotlight trừ accepted partial return và dùng mốc giao ổn định.
- Bằng chứng: client 24 passed, server 116 passed/78 opt-in skipped; PostgreSQL 17 tạm 74 passed; 5 browser suites PASS; build/migration check/server lint/lint client thay đổi PASS. Root lint còn 2103 errors/32 warnings cũ ngoài phạm vi.
- Audit cloud đợt này READ ONLY, không có chứng từ bất nhất trong các kiểm tra và chưa có bảng Phase 4. Hai migration mới, provider/SMTP/S3/scheduler/deployment thật chưa chạy. Không áp dụng lại phê duyệt migration cũ cho migration mới. [Runbook và giới hạn chi tiết](PHASE-4-FULFILLMENT-RETURNS-JOBS.md).


## Nghiệm thu Phase 5 ngày 21/10/2026

- Quan hệ admin dùng picker tìm kiếm/phân trang; product editor lưu product/SKU/thuộc tính/content/media/thứ tự và adjustment kho trong một transaction. expectedVersion và request ID/hash chống ghi đè/replay; productType chỉ đọc; xóa product/SKU chuyển archived/discontinued để giữ lịch sử.
- Favorites theo tài khoản có unique; comparison giữ tối đa 4 ID SKU cùng loại, nạp lại DTO/giá/thông số công khai. Newsletter có consent và double opt-in, token hash có purpose/expiry/generation, outbox token mã hóa; không báo đã đăng ký trước xác nhận, không gửi marketing hàng loạt.
- Preferences transactional=true/marketing=false được lưu DB; worker kiểm transactional, email bảo mật tiếp tục bắt buộc. Form contact và admin chat thành support tickets có owner/assignee, polling, message request ID, open/answered/closed và ảnh riêng tư theo lifecycle. Raw chat CRUD cũ trả 410, không có chatbot.
- Better Auth TOTP chỉ bật sau xác minh, secret/recovery mã hóa; recovery dùng một lần kể cả concurrency. Google callback tạo session pending, API và UI chặn nghiệp vụ tới khi xác minh. Nhạy cảm cần recent first/second factor; native admin không được sửa 2FA hay né bàn giao master.
- Hồ sơ/ảnh được lưu atomic qua URL auth hiện tại; tài khoản được ẩn danh khi hết nghiệp vụ đang mở và đã bàn giao master. Thu hồi session/provider links/2FA, xóa PII và dữ liệu hỗ trợ không cần giữ; tombstone bảo toàn FK/chứng từ. DB trigger và owner lock ngăn late writes hồi sinh tài khoản.
- Bằng chứng: client **26 passed**, server **116 passed/95 opt-in skipped**; PostgreSQL 17 tạm **91 passed** (17 Phase 5, 74 regression); **6 browser suites** PASS; build/migration check/server lint/lint client thay đổi PASS. Root lint **2103 errors/32 warnings** cũ thuộc Phase 6.
- Cloud chỉ audit READ ONLY: chưa có schema Phase 5, 0 legacy support/0 orphan account. Ba migration mới và Google/SMTP/storage private-policy/scheduler/deployment thật chưa nghiệm thu. **DONE local; PARTIAL/BLOCKED rollout**; Phase 6 lúc đó chưa triển khai, kết quả hiện tại ở mục bên dưới. [Tiêu chí/API/schema và migration runbook](PHASE-5-ADMIN-ACCOUNTS-SUPPORT.md).


## Nghiệm thu Phase 6 ngày 22/10/2026

- Tất cả route/controller/middleware HTTP dùng Express 5 req/res/next; Better Auth native Node handler, raw webhook trước JSON parser, Multer memory upload giới hạn 4M và lifecycle/quyền ảnh được giữ. CORS, Helmet, compression, cookie parser, express-rate-limit và express-session đã cài và mount.
- Rate limit PostgreSQL dùng chung giữa instance; session phụ trợ có PostgreSQL store/TTL, không thay đăng nhập Better Auth và không sinh row/cookie cho truy cập chưa dùng session. Job có xác thực dọn session hết hạn, không timer startup. Migration `20261021165401_phase6_express_sessions` chưa apply cloud.
- Vercel Express entrypoint dùng `package.json` `main` trỏ tới Vite-bundled `dist/index.js` với runtime dependencies inline; client/server có lệnh chạy riêng, không Turbo. Hai project Vercel, CI Node/Deno và runbook OAuth/SMTP/scheduler/bucket/migration đã cập nhật.
- 154 template được chứng minh không import đã chuyển archive có manifest; legacy giữ nguyên. Hook/context/constants được tách, service hook đặt tên đúng và component có prop validation. Source chạy không còn eslint-disable; generated code/legacy/archive/build được loại theo đúng nguồn.
- Local PASS: client 26 tests, server 124 tests/98 opt-in skipped; PostgreSQL tạm 94 tests qua Express, 6 browser suites, frozen install, build client/server, migration check và lint **0 errors/0 warnings**. Provider/S3/SMTP mock; không gọi là sandbox thật.
- Audit cloud chỉ READ ONLY: 0 balance vi phạm, 0 review trùng; các bảng Phase 1–6 được kiểm tra chưa hiện diện, history cuối vẫn migration blushing_marauders. Không apply migration mới hay ghi cloud; Vercel/Google/SMTP/bucket-private-policy/scheduler/provider sandbox thật chưa nghiệm thu. **DONE local, PARTIAL/BLOCKED rollout**. [Runbook và bằng chứng](PHASE-6-EXPRESS-VERCEL.md).
