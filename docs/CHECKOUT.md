# Checkout và thanh toán

## Luồng đã triển khai

Một wizard `/purchase` cho giỏ hàng, nhận hàng, chọn thanh toán và xác nhận. Sau khi đặt, `?orderId=<UUID>` hiển thị đơn thật và tiếp tục thanh toán. Tham số redirect từ nhà cung cấp không quyết định trạng thái đã trả tiền. Lịch sử `/user/order` và chi tiết `/user/bill` dùng dữ liệu riêng của tài khoản, không còn dữ liệu mẫu.

Giao hàng chỉ nhận `addressId` từ sổ địa chỉ của tài khoản; server không chấp nhận địa chỉ tự nhập, user ID, giá hoặc tổng tiền trong request checkout. Nút Thêm địa chỉ lưu qua `/me/addresses`, sau đó chọn bản ghi đã lưu. Không dùng danh sách cửa hàng mẫu để tạo đơn thật.

Server đọc giá/sản phẩm/biến thể/tồn kho từ PostgreSQL, yêu cầu sản phẩm active, giá nguyên VND lớn hơn 0, số lượng nguyên và tồn kho khả dụng tại địa điểm active. Không tự tạo tồn kho. Sản phẩm nháp/inactive hoặc giá 0 từ import không thể đặt hàng.

Báo giá có fingerprint của giá, địa chỉ và tỷ giá; đặt đơn kiểm tra lại fingerprint. Mỗi requestKey chỉ tạo một đơn, thay đổi nội dung nhưng dùng lại key bị từ chối. Giá trị trên localStorage chỉ phục vụ hiển thị giỏ hàng, không được dùng làm nguồn giá server.

Transaction khóa tài khoản và dòng tồn kho, tạo đơn/item/ảnh chụp địa chỉ/payment, ghi reservation và lịch sử. Không trừ hàng thực tế ngay lúc thanh toán; quản trị chuyển đơn sang completed sẽ xuất kho đúng một lần. COD được ghi nhận đã thu tiền khi quản trị hoàn tất đơn giao hàng. Đơn trực tuyến chưa paid không thể chuyển sang processing/completed. Các CRUD sửa trực tiếp tài chính/item/payment của đơn checkout bị chặn; sử dụng luồng nghiệp vụ.

## Sáu phương thức

- COD: đơn confirmed, payment unpaid; không ghi nhận tiền trước khi giao xong.
- MoMo: tạo yêu cầu bằng đúng số tiền và mã phiên, nhận `payUrl`, đối soát qua `/query`.
- ZaloPay: mã YYMMDD theo giờ Việt Nam, số tiền thật và callback cấu hình, nhận `order_url`, đối soát API query.
- PayPal: Orders v2, quy đổi VND sang USD theo `PAYPAL_VND_PER_USD=25000` được chủ dự án chọn. Lưu tỷ giá/USD cùng giao dịch; chỉ completed capture mới là paid. Capture có idempotency key và được tuần tự hóa với hủy đơn.
- Stripe: trang Hosted Checkout. Chọn phương thức con theo cấu hình Stripe Dashboard, không dùng luồng mobile Payment Sheet. VND là zero-decimal. Kiểm tra payment_status và số tiền/currency/provider ID trước khi ghi nhận paid.
- VNPAY: vẫn có tên provider và endpoint, hidden/disabled trên registry và UI; server từ chối dùng trong checkout khi đang tạm ngừng.

SDK/API cũ trả các payload khác nhau; kết quả gọi sandbox controller cũ được ghi trong `payment-controller-probe.json`. Adapter mới chuẩn hóa thành `{ providerId, url }`; kiểm tra thực tế bốn gateway trong `payment-gateway-probe.json` đều thành công và còn pending. Các probe chỉ tạo phiên sandbox, không gửi/capture thanh toán.

## API

- `GET /checkout/methods`: danh sách, enabled, hidden.
- `POST /checkout/quote`: `{ items: [{variantId, quantity}], addressId, shipping: standard|express, provider, note, voucherCode? }`.
- `POST /checkout/orders`: `{ requestKey: UUID, quoteToken, checkout: <payload trên> }`.
- `POST /checkout/orders/:id/pay`: tạo/tiếp tục phiên từ đơn thuộc tài khoản; số tiền lấy từ snapshot server.
- `POST /checkout/orders/:id/refresh`: đối soát server và capture PayPal khi đã được người mua approve.
- `POST /checkout/orders/:id/cancel`: chỉ hủy khi chưa thu tiền và chưa xử lý giao; không giải phóng hàng chỉ vì trình duyệt báo hủy.
- `GET /me/orders`, `GET /me/orders/:id`: dữ liệu của tài khoản hiện tại.

API checkout yêu cầu session và kiểm tra Origin/Fetch Metadata cho request ghi; có rate limit. Các endpoint legacy `/wallet/{provider}` và `/paypal/create|capture` chỉ nhận `orderId` nội bộ đã kiểm tra quyền, không còn nhận tổng tiền tùy ý.

## Callback / webhook

- MoMo POST `/wallet/momo/callback`: HMAC + partnerCode, sau đó truy vấn lại gateway.
- ZaloPay POST `/wallet/zalopay/callback`: HMAC key2 của chuỗi data gốc, sau đó truy vấn lại gateway.
- Stripe POST `/wallet/stripe/webhook`: raw body trước JSON middleware, kiểm tra chữ ký bằng `STRIPE_WEBHOOK_SECRET`, rồi truy vấn session trên Stripe.

Callback lặp không ghi nhận tiền hoặc giải phóng tồn kho nhiều lần. Bắt buộc khớp provider ID, currency, amount và mã giao dịch. Thanh toán thật đến muộn sau khi đơn đóng được ghi `paid_late`, payment metadata `requiresRefund: true`, order giữ cancelled; không tự xuất kho. Phần hoàn tiền về gateway cần quản trị đối soát/thực hiện, chưa tự động hoàn tiền.

Không có PayPal webhook trong phiên bản này; trạng thái được xác minh bằng Orders API khi khách quay lại hoặc bởi tác vụ đối soát định kỳ. Không dựa vào callbackURL/token/PayerID của trình duyệt để đánh dấu paid.

## Cấu hình và vận hành

Các khóa server trong `.env.example`; không gửi secret ra client hoặc log upstream payload. `MOMO_ENABLED` và `PAYPAL_ENABLED` đã bật trong môi trường local sandbox hiện tại để đáp ứng yêu cầu. Giữ `PAYPAL_VND_PER_USD=25000` hoặc cập nhật tỷ giá chủ động; đơn đã tạo giữ tỷ giá cũ.

Khi deploy phải cấu hình URL HTTPS public:

- `VITE_PUBLIC_SERVER_URL`, `VITE_PUBLIC_CLIENT_URL`.
- `MOMO_IPN_URL=https://<api>/wallet/momo/callback`.
- `ZALOPAY_MERCHANT_CALLBACK_URL=https://<api>/wallet/zalopay/callback`.
- Đăng ký Stripe webhook HTTPS public với các event checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired, checkout.session.async_payment_failed, và lưu signing secret trong `STRIPE_WEBHOOK_SECRET`.

Không đăng ký endpoint localhost làm webhook public. Hiện chưa có Stripe webhook signing secret trong cấu hình local; user quay về trang và job đối soát vẫn xác minh trạng thái bằng API Stripe.

Chạy định kỳ mỗi phút từ thư mục server:

```sh
pnpm checkout:reconcile
```

Job đối soát phiên online đang chờ, capture PayPal đã approve khi còn hạn, đóng/giải phóng phiên hết hạn khi provider đã xác nhận. Stripe hết hạn được expire qua API; MoMo/ZaloPay chỉ giải phóng khi query xác nhận failed. Khi timeout tạo phiên, giữ reservation và retry cùng idempotency key/mã merchant thay vì tạo giao dịch thứ hai. Nếu provider vẫn chưa cho trạng thái chắc chắn, giữ hàng và báo lỗi để đối soát; không tự giả định thất bại.

Giới hạn vận hành: refund chưa tự động; webhook HTTPS và lịch chạy job cần được cấu hình trên hạ tầng triển khai; cần cập nhật tồn kho thật qua quản trị trước khi bán. Không nhập kho giả để vượt bước kiểm tra.

## Kiểm thử

```sh
pnpm test
RUN_CLOUD_CHECKOUT_TESTS=true pnpm exec vitest run tests/checkout-cloud.test.js
node scripts/probe-payment-controllers.mjs
node tests/browser/checkout.mjs
```

Test cloud dùng fixtures tạm, mock gateway và tự dọn. Probe gateway chỉ cho chạy với cấu hình sandbox/test của cả bốn provider và không capture. Browser test dùng Vite port 5199, mock API/gateway; kiểm tra COD, chuyển hướng Stripe, VNPAY ẩn, thêm/chọn địa chỉ và mobile.

## Tài liệu đối chiếu

- https://developers.momo.vn/v3/vi/docs/payment/api/payment-api/query/
- https://docs.zalopay.vn/docs/developer-tools/knowledge-base/callback/
- https://developer.paypal.com/api/codes/currency/
- https://developer.paypal.com/whats-an-order/
- https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods
- https://docs.stripe.com/payments/checkout/fulfill-orders

### Trạng thái khách hàng sau thanh toán

Lịch sử đơn và trang xác nhận hiển thị “Đã thanh toán / Chờ giao hàng” khi `paymentStatus=paid`, `orderStatus` là `confirmed` hoặc `processing`, và chưa giao xong. Đơn này chuyển khỏi nhóm Đang xử lý sang nhóm Đã thanh toán / Chờ giao hàng; COD chưa thu tiền giữ nhóm Đang xử lý. Khi giao vận đánh dấu shipped, nhãn là Đã thanh toán / Đang giao hàng. Thanh toán không tự hoàn thành đơn hoặc xuất kho. Chỉ nghiệp vụ giao xong chuyển completed/delivered và xuất kho. Đây là giai đoạn tổng hợp từ trạng thái thanh toán và giao hàng hiện có, không cần thêm enum DB; đơn cũ đã thanh toán cũng hiển thị đúng. Thanh toán đến muộn cho đơn hủy không thuộc nhóm chờ giao.

## Bổ sung tương thích legacy

Checkout hỗ trợ mã giảm giá và lưu `discountTotal` cùng lượt dùng trong transaction tạo đơn. Giỏ tài khoản, review của khách và thống kê đầy đủ được mô tả trong [LEGACY-PARITY.md](./LEGACY-PARITY.md).
