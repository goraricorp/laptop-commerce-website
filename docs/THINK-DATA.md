# Dữ liệu ThinkPro

Chạy trong thư mục `server`:

```sh
node scripts/think-data.js --laptop-only
node scripts/think-migrate.mjs --laptop-only
pnpm db:seed:inventory
node scripts/verify-think-data.mjs
```

Bỏ `--laptop-only` để xử lý tất cả danh mục. Import một danh mục bằng `--category=ergonomic-chair`.

Scraper đọc dữ liệu SSR Nuxt của trang nguồn, lấy giá bán theo SKU, cấu hình, màu, tình trạng và trạng thái còn hàng. Không suy giá từ các con số trong tên máy hoặc dùng giá gạch ngang làm giá bán. Mỗi lần cào có bản sao JSON trước khi cập nhật và ghi file theo từng danh mục. Lỗi cào được đánh dấu `scrapeError`; importer bỏ qua dữ liệu đó.

Importer cập nhật sản phẩm theo tên/danh mục và SKU nguồn, giữ ID biến thể mặc định lần import cũ cùng tồn kho và tham chiếu đơn hàng. SKU bị nguồn bỏ đi được chuyển inactive. Giá không hợp lệ không được mở bán. Chạy lại không tạo thêm cùng SKU của một sản phẩm. Nguồn đổi tên sản phẩm cần đối chiếu thủ công để tránh coi đó là sản phẩm mới.

`verify-think-data.mjs` đối chiếu giá và tên từng SKU laptop với JSON; `--quarantine-navigation` chuyển 5 link danh mục bị scraper cũ nhận nhầm thành laptop về draft, giữ nguyên lịch sử và kho.

Giá/khả năng cung cấp là ảnh chụp tại thời điểm cào (`scrapedAt`), không đồng bộ thời gian thực. Chỉ SKU được chọn trên trang có bộ thông số chi tiết; SKU khác vẫn có nhãn cấu hình/màu/tình trạng riêng từ `options`, không dùng chung thông số của SKU khác.
