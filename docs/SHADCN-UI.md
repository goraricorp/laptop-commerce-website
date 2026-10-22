# Giao diện shadcn/ui

Ngày cập nhật: 22/10/2026. Giữ preset `base-vega`, Base UI, Lucide và token màu hiện có. Các component được thêm từ registry `@shadcn`; không ghi đè component đã tùy chỉnh bằng `--overwrite`.

| Khu vực | Component đang sử dụng |
| --- | --- |
| Banner và hai dải sản phẩm trang chủ | Carousel, CarouselContent, CarouselItem, CarouselPrevious/Next; Embla quản lý cuộn, kéo và bàn phím |
| Menu danh mục / tìm kiếm | Popover, Tabs, ScrollArea, Combobox, InputGroup |
| Sản phẩm / bộ lọc / so sánh | Card, RadioGroup, Checkbox, NativeSelect, Table, Pagination |
| Giỏ hàng / checkout / đơn hàng | Sheet, Card, FieldGroup/Field, RadioGroup, Checkbox, Badge, Alert, Pagination |
| Tài khoản / xác thực | Field, FieldLabel, FieldError, InputGroup cho mật khẩu, InputOTP cho mã sáu số, Switch cho tùy chọn thông báo |
| Quản trị | Table, Pagination, Combobox tìm kiếm quan hệ, Dialog/AlertDialog, Field, Input, Textarea, Collapsible |
| Hỗ trợ khách hàng | Item, MessageScroller, Message, Bubble, Attachment |
| Trạng thái giao diện | Empty, Skeleton, Spinner, Alert và toast Base UI hiện có |
| Tùy chỉnh giao diện | Sheet, ToggleGroup/ToggleGroupItem |

Banner tại `components/block/home-banner.jsx` khôi phục bố cục legacy: sáu ảnh, cao 500px trên desktop (co theo viewport nhỏ), chú thích trên ảnh, mũi tên hai bên, thanh chọn bên dưới và tự chuyển fade mỗi 5 giây. Dùng plugin Embla Fade/Autoplay 8.6.0 cùng phiên bản carousel hiện có.

`components/block/horizontal-rail.jsx` dùng cho hai dải sản phẩm, chỉ ghép Carousel shadcn: không còn tự quản lý `scrollLeft`, resize listener hoặc nút điều hướng riêng. Mỗi dải laptop/sản phẩm mới tải tám sản phẩm; desktop hiển thị năm cột. Catalog giữ bộ lọc 1/5, kết quả 4/5, bốn cột sản phẩm và 12 sản phẩm/trang.

Phần riêng của ứng dụng vẫn được giữ: bố cục responsive, logo/ảnh, bản xem trước theme, chọn SKU và render thông số/nội dung sản phẩm, các bước checkout, biểu đồ và lifecycle upload ảnh. Các phần này ghép các primitive shadcn cho control, overlay và phản hồi. Input file và URL ẩn tiếp tục phục vụ workflow upload/cancel/save.

Component registry được bổ sung PropTypes và tách hook/variant sang module riêng để đáp ứng lint/Fast Refresh của dự án. Carousel đồng bộ trạng thái Embla bằng `useSyncExternalStore`; Tabs chuyển `orientation` tới Base UI. Các control được render nhiều lần dùng `useId` để giữ liên kết nhãn chính xác. Toast đo chiều cao nội dung tự nhiên, tránh vòng ResizeObserver khi xếp nhiều thông báo.

Kiểm chứng local: chạy riêng tại `client` các lệnh `deno run lint`, `deno run test`, `deno run build`; tại `server`, chạy `deno run test:e2e`. Browser suites mô phỏng toàn bộ API; không dùng kết quả này làm bằng chứng thanh toán, SMTP hay cloud database thật.

Kết quả 22/10/2026:

- Client: 26 unit tests PASS; lint PASS (0 lỗi, 0 warning); Vite production build PASS.
- Sáu browser suites: `admin-parity`, `checkout`, `catalog`, `phase3`, `phase4`, `phase5` PASS. Sau sửa toast, chạy lại `admin-parity` và `phase5` PASS, bao gồm bắt lỗi `window.error`, upload/cancel/save, tăng số lượng nhanh trong Sheet và gửi review thật qua API mô phỏng.
- Đã kiểm tra ảnh chụp desktop/mobile trang chủ, form đăng nhập và tùy chỉnh dark mode. Browser checks xác nhận tám sản phẩm/dải, năm cột desktop, không tràn ngang mobile, Enter tìm kiếm, carousel bằng bàn phím, menu danh mục bằng Popover/Tabs, Switch lưu đúng FormData, InputOTP sáu ô và nhãn form lặp không trùng ID.

## Ô thông tin trong bảng admin

`TableIdentity` tại `components/element/table-identity.jsx` ghép Avatar shadcn (36px, bo góc, fallback chữ viết tắt), tên và dòng phụ. `ResourceForm` dùng chung cho các tài nguyên; bảng đơn hàng/thống kê cũng dùng component này cho khách hàng.

- Sản phẩm/danh mục: ảnh + tên, dòng dưới là mô tả. API admin sản phẩm bổ sung `imageUrl` từ ảnh chính (ưu tiên `isPrimary`, sau đó vị trí và ID); lấy theo batch cho trang hiện tại, không gọi API riêng từng dòng. Không thay schema DB.
- Thương hiệu: logo + tên, dòng dưới là slug hiện có.
- Người dùng: avatar + tên, dòng dưới là email; ảnh lỗi/thiếu dùng chữ viết tắt như `AD`.
- Thuộc tính: tên và `code | displayType`, ví dụ `ram | text`.
- Các trường ảnh và trường đã ghép vào dòng phụ không còn cột riêng. Giữ tra cứu tên quan hệ, tìm kiếm, sắp xếp, phân trang và thao tác sửa.
- `isActive` và trạng thái khóa tài khoản hiển thị cột “Trạng thái”, dùng Badge “Đang hoạt động” / “Ngừng hoạt động”. Các trạng thái sản phẩm khác giữ ý nghĩa riêng.

Có browser suite `admin-table-presentation` với API mô phỏng để kiểm chứng ảnh, fallback, dòng phụ, Badge và điều hướng chỉnh sửa; ảnh chụp kiểm tra nằm trong `/tmp/admin-table-review` khi chạy local.

Riêng bảng sản phẩm: cột đầu là ảnh + tên, dòng phụ `slug | summary`; cột thứ hai là logo + tên thương hiệu, dòng phụ là loại sản phẩm. Không còn cột danh mục/loại sản phẩm riêng. Picker thương hiệu trả thêm `logoUrl` theo batch để dùng đúng logo; thiếu logo dùng chữ viết tắt của tên thương hiệu.
