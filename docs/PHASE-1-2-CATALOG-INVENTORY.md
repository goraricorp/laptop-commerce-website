# Phase 1 và Phase 2 — 21/10/2026

## Trạng thái

- **DONE về code và nghiệm thu local:** Phase 1 và Phase 2. PostgreSQL 17 thật chạy trên localhost, dữ liệu và cluster bị xóa sau test.
- **PARTIAL về rollout:** hai migration mới chưa được áp dụng lên Neon; chưa triển khai Vercel hoặc chạy kiểm thử ghi cloud. Cần duyệt database/phạm vi trước bước này theo kế hoạch.
- Các pha 3–6 giữ phạm vi đã chốt. Shipment/partial return chưa được đưa vào Phase 2.

## Phase 1

Public catalog dùng DTO allowlist và kiểm tra visibility cả qua ID, danh sách lẫn quan hệ. Giá vốn, barcode nội bộ, metadata thuộc tính, review pending/hidden và danh tính người đánh giá không nằm trong response public. Sản phẩm/biến thể ẩn, hãng ngừng hoạt động và danh mục có tổ tiên ngừng hoạt động bị loại. Cookie admin không mở rộng response public. Các URL đọc cũ tiếp tục hoạt động; URL ghi cũ trả 404.

CRUD quản trị nằm tại `/admin/catalog/{resource}` cho `categories`, `brands`, `products`, `product-variants`, `product-media`, `product-content-sections`, `attributes`, `attribute-values`, `variant-attribute-values` và `campaigns`. Admin/master mới truy cập được, response `no-store`; write kiểm tra origin và Zod strict. Validation trả `issues[].path`; FK, quan hệ media–SKU và chu trình danh mục được kiểm tra. Frontend dùng namespace admin riêng và invalidation chung cho public search/detail.

Inventory dùng chung `services/stock-ledger.js` cho receipt, issue, adjustment, return, reserve/release và hoàn tất checkout. Tạo balance bằng conflict-safe insert, khóa theo `(locationId, variantId)`, cập nhật có điều kiện và giữ `0 ≤ reserved ≤ onHand`. Các script seed cũng đi qua service này; không tạo reserved không có đơn giữ hàng.

Operation key duy nhất kèm hash lưu kết quả cũ; cùng ID nhưng payload hoặc actor khác trả 409. Replay vẫn hợp lệ nếu kho đã được ngừng hoạt động sau lần ghi đầu. Movement lưu actor từ phiên, nguồn nghiệp vụ và before/after của cả onHand/reserved. API không có cập nhật/xóa ledger. Khi nhân viên hoàn tất hoặc hủy COD, ledger ghi actor nhân viên; tác vụ gateway tự giải phóng không giả danh nhân viên.

Các API mới (chỉ admin/master):

| API | Input/kết quả |
| --- | --- |
| `POST /inventory/transfers` | `operationId`, `sourceLocationId`, `targetLocationId`, `variantId`, `quantity > 0`, `note`; hai movement trong một transaction |
| `GET /inventory/operations/:id` | Operation và kết quả đã lưu |
| `GET /inventory/reconciliation` | Balance thực, baseline + ledger, tổng reservation và các chênh lệch; chỉ đọc |
| `POST /inventory/reconciliation/adjust` | `operationId`, `locationId`, `variantId`, `expectedActualOnHand`, `quantityOnHand`, `note` (sửa reserved cần thêm `expectedActualReserved`, `quantityReserved` và đích đúng tổng reservation đang giữ); kiểm số thực tại thời điểm khóa, lưu adjustment và baseline trước/sau có audit |

`POST /inventory/stock/movement` yêu cầu operationId/note; chỉ nhận receipt/issue/adjustment/return. Receipt/issue/return nhập số lượng dương, adjustment nhận delta có dấu. Reservation/release được điều khiển bởi checkout. PATCH balance chỉ nhận `reorderLevel`.

Chỉ retry transaction cho `40001` hoặc `40P01`, tối đa ba lần. Không retry lỗi nghiệp vụ. Các callback giao dịch có retry không gọi payment provider/SMTP. Luồng refresh payment cũ chưa được chuyển thành outbox (Phase 4) và không nằm trong wrapper retry này.

## Phase 2

`GET /catalog/search` nhận `q`, `type` (slug danh mục hoặc `all`), `categoryId` (gồm hậu duệ), `brandId` (UUID phân cách dấu phẩy), `brand` (tương thích tên/slug link cũ), `minPrice`, `maxPrice`, `sort`, `page`, `limit` (tối đa 100) và `attributes` JSON `{ "ma-thuoc-tinh-hoac-uuid": ["value-uuid"] }`.

Response có `items`, `total`, `page`, `limit`, `facets`. Mỗi item có SKU đại diện, ảnh, hãng và `available` tổng hợp từ các kho đang hoạt động; không có số tồn từng kho/giá vốn. Các SKU phải active, có giá dương và sản phẩm public. OR trong cùng nhóm thuộc tính; AND giữa nhóm, giá và search trên cùng SKU. SKU đại diện có giá thấp nhất trong các SKU khớp, tie-break bằng ID. Sort hỗ trợ `newest`, `name`, `price-asc`, `price-desc`; product ID phá hòa. Count và trang lấy cùng snapshot SQL.

Facets lấy bằng SQL trên scope search/danh mục trước khi áp các lựa chọn hãng, giá và thuộc tính, giúp khách có thể thêm/bỏ lựa chọn. Facets chỉ gồm dữ liệu public đang gắn SKU thật. URL giữ toàn bộ bộ lọc, sort, page; đổi filter/sort về trang 1. Không tải 200 sản phẩm/300 SKU về để lọc cục bộ nữa.

`GET /product/:id/details` trả product, brand, toàn bộ SKU public với attributes/availability, media và content sections đã sắp xếp. Chọn SKU đổi giá, thông số, ảnh và khả năng mua. Nội dung mặc định `plain`; `html` phải khai báo rõ, được sanitize allowlist khi ghi và khi đọc dữ liệu cũ. Script, handler, iframe/embed, style và URL JavaScript không được render. [Tài liệu sanitizer](https://github.com/apostrophecms/apostrophe/tree/main/packages/sanitize-html). Có Đọc thêm/Thu gọn, loading/error/empty, radio/checkbox/select dùng bàn phím và layout mobile.

Campaign có bảng thật và CRUD/upload chung trong admin → Sản phẩm → Campaign và banner. `GET /catalog/campaigns` chỉ trả campaign đang có hiệu lực, sản phẩm public, promotion còn hiệu lực khi có liên kết. Điều kiện giảm/tối thiểu/tối đa lấy từ promotion thật. Ảnh campaign được tính trong lifecycle reference/cleanup.

`GET /catalog/spotlight` lấy số lượng ở đơn completed + paid trong 7 ngày (mốc lịch sử completed, fallback updatedAt cho đơn cũ không có event), loại đơn returned/cancelled/unpaid. Không có doanh số thì frontend ẩn khối. Dữ liệu hiện tại chỉ có trả toàn đơn; partial return và lượng trả từng dòng sẽ được nối ở Phase 4 khi có mô hình nghiệp vụ đó.

Home, menu danh mục/hãng, product list/detail và thẻ sản phẩm bỏ thông số, banner giảm giá, quà tặng, cam kết giao 2H/bảo hành và nhãn bán chạy/nổi bật viết cố định. Không dựng campaign, stock hoặc doanh số thay thế khi API rỗng. Bảo hành, favorites/comparison và newsletter không được dựng nghiệp vụ giả trong các màn hình mới.

## Bằng chứng kiểm thử

| Lệnh | Kết quả |
| --- | --- |
| `deno install --frozen` | PASS với root lockfile |
| `deno task test` | Client **22 passed**; server **94 passed**, **41 skipped** do các suite database/cloud opt-in |
| `deno task test:postgres` | **36 passed**: 19 Phase 1 + 8 Phase 2 + 9 checkout regression; PostgreSQL 17 thật, chỉ localhost |
| `deno task test:e2e` | PASS admin/user edit, upload cancel/save/error, giỏ tăng nhanh, thống kê/voucher/review; 6 checkout scenarios; catalog URL/filter/page, SKU/cart/content/mobile/error/spotlight |
| `deno task build` | PASS cả client/server |
| `deno task --cwd server db:check` | PASS migration snapshots |
| Server lint | PASS |
| ESLint các file client trong phạm vi thay đổi | PASS |
| Root lint | Chưa PASS: 2103 lỗi/33 warnings cũ ở legacy/template/source khác; giữ cho Phase 6, không tắt rule hoặc bỏ qua source để che lỗi |

Test PostgreSQL tạo 240 sản phẩm/480 SKU, kiểm cùng SKU thỏa CPU/RAM/màu, khoảng giá, sorting/tie ID, tìm ngoài giới hạn cũ, parent/brand visibility, HTML độc hại, campaign hết hạn, availability kho và spotlight loại đơn trả. Test inventory gồm nhập/xuất đồng thời, hai khách giành suất cuối, checkout đấu adjustment, transfer hai chiều, lỗi chèn ở bên đích rollback cả hai kho, request trùng/khác payload, hủy/hoàn tất đồng thời, actor và đối soát có audit.

Runner `server/scripts/test-phase1.mjs` luôn tự tạo DATABASE_URL localhost; không nhận database đích để test ghi. Nó áp mọi migration lên cluster tạm và seed một checkout cũ trước Phase 1 để kiểm backfill giữ nguyên tồn 5/reserved 2. Nó cũng chạy audit với transaction READ ONLY. Payment/auth được mock trong suite mới; regression checkout mock provider; không gửi tiền/mail hoặc gọi bucket thật. Các cờ cloud trong runner chỉ bật 9 test checkout trên URL tạm do runner tạo.

Embedded PostgreSQL cần binary native và symlink postinstall cho đúng nền tảng. Khi setup mới, cho phép riêng lifecycle package `@embedded-postgres/<platform>-<arch>` theo [hướng dẫn Deno](https://docs.deno.com/runtime/reference/cli/install/#native-nodejs-addons), rồi chạy `deno task test:postgres`. macOS x64 trong đợt này dùng PostgreSQL 17.10, không cần database cloud. Linux chạy bằng tài khoản thường vì initdb không chạy dưới root.

## Migration và rollout

Hai migration **chưa chạy trên cloud**:

1. `server/src/database/migrations-v2/20261021032042_phase1_catalog_inventory/migration.sql`: operation, reservation chuẩn hóa, baseline và audit columns. Khóa ghi trong lúc chụp baseline/backfill; không UPDATE số tồn hoặc áp lại movement cũ.
2. `server/src/database/migrations-v2/20261021090928_phase2_storefront/migration.sql`: campaign, format content mặc định plain, indexes cho query và constraint format/ngày.

Trước khi apply trên database đích được duyệt:

1. Chạy `deno task audit:phase12` để xuất schema/index/history, orphan/duplicate/cycle, reservation không hợp lệ và chênh lệch held stock. Lệnh chỉ chạy transaction READ ONLY, không tự sửa. Kiểm tra kết quả với snapshot migration đã áp dụng, không stamp baseline mới nếu schema khác.
2. Chốt danh sách migration/phạm vi và backup theo môi trường. Nếu orphan/JSON reservation không hợp lệ thì xử lý có audit trước; chênh lệch tồn không được sửa tự động.
3. Sau phê duyệt cụ thể, chạy `deno task --cwd server db:migrate` trong cửa sổ vận hành phù hợp, rồi triển khai client/server tương ứng. Không triển khai code cần bảng mới trước migration. Không chạy db:push/reset hay migration trong build/request.
4. Kiểm public DTO/draft, admin namespace, query/detailed SKU và báo cáo reconciliation. Các bài test ghi cloud/bucket/payment vẫn cần phạm vi riêng.
5. Rollback ưu tiên deployment tương thích hoặc tắt chức năng, giữ dữ liệu mới. Không đưa public catalog về phiên bản lộ giá vốn/draft và không down migration xóa ledger/reservations.

File chính: `server/src/services/{public-catalog,catalog-admin,catalog-search,stock-ledger,inventory}.js`, schemas/routes tương ứng, checkout/order/storage integration, hai migrations; frontend services/schemas/admin config, product list/detail/home/card/header; tests và runner kể trên. Không sửa secret hoặc thư mục legacy.
