# Phase 4 — vận chuyển, trả hàng, hoàn tiền và job nền

Trạng thái: **DONE code/local acceptance**; **PARTIAL rollout**. Kiểm chứng provider refund, SMTP, scheduler và Vercel thật **BLOCKED** vì chưa thực hiện cấu hình/nghiệm thu ngoài hệ thống và chưa có phạm vi test ghi/sandbox được phê duyệt. Không coi các mock là bằng chứng giao dịch thật.

Đợt này chỉ triển khai Phase 4. Thay đổi ở checkout, inventory regression, catalog spotlight, thống kê, admin resource permissions và tooling là các điểm tích hợp bắt buộc; không triển khai tính năng Phase 5–6. Giữ nguyên legacy và thay đổi workspace có sẵn, không sửa `.env.local`.

## Hành vi và bằng chứng nghiệm thu

| Tiêu chí | Triển khai | Bằng chứng |
| --- | --- | --- |
| Shipment có lịch sử, không CRUD trạng thái tùy ý | Command prepare/handover/delivered/failed/retry; một chuyến toàn đơn, khóa session → order → fulfillment → balances | PostgreSQL concurrency, native Hono, browser admin |
| Xuất kho ở bàn giao, đúng một lần | So khớp reservation với từng SKU trên chứng từ; ledger issued tại handover; delivery không trừ kho | Hai request đồng thời cùng command; regression COD/online |
| Giao thành công có người chịu trách nhiệm | Chỉ admin/master; event có actor/command/note; COD phải có chứng từ đã thu | API authorization, strict input, browser COD proof |
| Đơn cũ không bị trừ lại | order_fulfillment backfill từ ledger/completion/delivery, fallback có provenance; không sửa balance | Fixture được tạo trước migration, kiểm mốc và tồn sau migration |
| Trả từng phần trong 15 ngày | Khóa order, chọn unit indices chưa có hồ sơ không bị từ chối; ownership, hạn từ deliveredAt | Hai yêu cầu tranh đơn vị cuối, quá hạn, IDOR, vượt lượng |
| Nhận và kiểm hàng | requested → approved/rejected → received → inspected → completed; từng dòng có accepted/restock/kho/tình trạng/lý do | Test nhập một phần, hàng hỏng không tự tăng tồn; browser chọn kho |
| Giao thất bại | Có thể giao lại khi chưa có hồ sơ nhận hàng; hoặc admin nhận qua hồ sơ trả và kiểm hàng; COD chưa thu không tạo tiền hoàn | PostgreSQL kiểm giao lại không xuất lần hai, chặn giao lại sau yêu cầu nhận hàng |
| Hoàn tiền sau giảm giá | Snapshot allocation ngay checkout; backfill chứng từ cũ nhất quán; largest remainder theo ID và unit base/remainder, giữ từng VND | Unit test nhiều dòng, nhiều đợt partial refund bảo toàn tổng |
| Không hoàn vượt tiền/phí giao | Serialize theo order; succeeded + pending + processing + needs_review giữ ngân sách; phí giao mặc định 0, có lý do riêng, không vượt đã thu | Concurrent shipping refund, overflow, rollback, kiểm legacy refund thiếu ledger |
| Không hoàn trùng khi timeout | Persist submittedAt trước gọi provider; lần sau chỉ query cùng reference; terminal result không bị event cũ đảo ngược | Timeout/query, mismatch amount/currency/reference, expired lease recovery |
| Có retry sau thất bại dứt điểm | Chỉ refund failed đã xác minh mới giải phóng ngân sách; admin tạo hồ sơ mới có lý do/reference mới; unique return chỉ áp dụng refund chưa failed | PostgreSQL failed → hồ sơ mới; không nhập kho lại |
| Không hoàn lượt voucher khi trả/hoàn | Chỉ cancel chưa thu tiếp tục restoreVoucher đúng một lần; paid cancellation và return không gọi restore | Regression hủy cũ + test usage giữ nguyên sau hủy đã thu |
| Inbox/outbox bền vững | Chỉ lưu webhook sau kiểm chữ ký; unique provider/event; outbox cùng transaction, query provider để xác minh số tiền/currency/reference | Raw Stripe regression, provider contract mocks, concurrent inbox dedupe |
| Provider/SMTP ngoài DB transaction | Provider payment refresh đã tách khỏi transaction; refund/email worker gọi ngoài transaction rồi persist kết quả | PostgreSQL NOWAIT kiểm không giữ session lock trong gateway call |
| Job có xác thực và phục hồi | Bearer secret tối thiểu 32 ký tự, constant-time compare; job lease; outbox SKIP LOCKED/fencing; batch/deadline, ưu tiên webhook/refund | HTTP thiếu/sai secret, lease ngăn chạy trùng, hai worker lấy cùng việc |
| Quét ảnh không bị kẹt | Giữ lifecycle cũ, limit/deadline, ưu tiên delete_pending; checked_at xoay các ảnh đang được tham chiếu | PostgreSQL lần một giữ ảnh đang dùng, lần hai xóa orphan; S3 mocked |
| Vận hành và thống kê | Backlog/lỗi/lần chạy cuối; hồ sơ trả đang mở, paid_late, refund cần xử lý; thao tác đối soát; collected/refunded/net | PostgreSQL đối chiếu tổng trực tiếp SQL; UI/mock regression |

Inventory và financial side effects được chống trùng bằng transaction/khóa/ledger/reference. Outbox email là **at least once**: Message-ID ổn định hỗ trợ nhận diện thư lặp, nhưng SMTP không cung cấp bảo đảm exactly once nếu mất kết nối sau khi đã nhận thư. Không tuyên bố job gửi email có thể hoàn tác hoặc bảo đảm không bao giờ gửi lặp.

## API

Các URL dưới đây là backend; frontend thêm `/api` qua proxy/rewrite. Write API có Zod strict, trường issues/path, kiểm origin và user từ session. Không nhận actor/quyền từ payload.

| Method/path | Quyền | Nội dung |
| --- | --- | --- |
| GET `/me/orders/:id/fulfillment` | Chủ đơn | Vận chuyển, số lượng còn trả, hồ sơ và trạng thái hoàn công khai cho chủ đơn |
| POST `/me/orders/:id/returns` | Chủ đơn | `{commandId,note,items:[{orderItemId,quantity}]}` |
| GET `/admin/fulfillment/orders/:id` | Admin/master | Chi tiết đầy đủ, lý do, reference/proof cho xử lý nội bộ |
| POST `/admin/fulfillment/orders/:id/shipment` | Admin/master | action prepare/handover/delivered/failed/retry; prepare cần carrier/trackingNumber, COD delivered cần codProof |
| POST `/admin/fulfillment/orders/:id/returns` | Admin/master | Nhận lại chuyến giao thất bại để duyệt/nhận/kiểm hàng |
| POST `/admin/fulfillment/returns/:id` | Admin/master | approve/reject/receive/inspect/complete; inspect phải đủ từng return item, acceptedQuantity/restockQuantity/condition/note và kho nếu nhập lại |
| POST `/admin/fulfillment/orders/:id/refunds` | Admin/master | purpose return / paid_cancellation / shipping; returnId khi trả hàng; shippingAmount mặc định 0 và shippingReason nếu hoàn phí giao |
| POST `/admin/fulfillment/refunds/:id/confirm` | Admin/master | COD pending, chứng từ proof + lý do; không áp dụng cho online |
| POST `/admin/fulfillment/refunds/:id/reconcile` | Admin/master | Đưa cùng hồ sơ vào đối soát; PayPal có thể bổ sung/sửa providerRefundId sau timeout, kết quả vẫn phải khớp capture/custom_id/amount/currency |
| GET `/admin/fulfillment/operations` | Admin/master | Backlog tổng, tối đa 100 hồ sơ ngoại lệ/đang mở để quan sát; mở đơn gốc để xử lý, tổng return đang mở riêng |
| POST `/internal/jobs/dispatch` | Bearer | Claim và xử lý outbox, tối đa 5 việc/batch |
| POST `/internal/jobs/checkout` | Bearer | Đối soát tối đa 5 checkout/batch; deadline dừng bắt đầu lượt mới khi không còn ngân sách I/O |
| POST `/internal/jobs/images` | Bearer | Tối đa 10 asset/batch, không chạy lại trước một giờ sau lần hoàn tất |

Mọi command cần UUID commandId và note tối thiểu 3 ký tự. Retry nguyên payload dùng lại commandId, trả kết quả cũ; cùng ID đổi payload/actor/order trả 409. Frontend giữ ID khi request lỗi, toast báo kết quả và tải lại trạng thái.

POST/PATCH/PUT/DELETE `/shipment` và `/payment` qua CRUD cũ đã bỏ; bảng và direct editor tương ứng chỉ đọc. `/order/sale/:id/status` chỉ xử lý xác nhận/processing/hủy chưa thu theo nghiệp vụ hiện hữu, không cho chọn completed/returned để bỏ qua shipment/return. Chứng từ đã có fulfillment history không được sửa/xóa trực tiếp. Hoàn tiền và giao thất bại không tự tăng tồn hoặc tự coi thanh toán thành công.

`GET /admin/statistics` giữ phân trang/filter lịch sử, thêm collected/refunded; revenue = collected − refunded. Khoảng ngày là **ngày tạo đơn**, tổng tiền thu/hoàn gắn với các đơn trong khoảng đó, không phải báo cáo luân chuyển tiền theo ngày provider quyết toán. Spotlight 7 ngày trừ accepted returns và dùng deliveredAt/history ổn định, không coi cập nhật refund là ngày bán mới.

## Provider adapters và webhook

- Stripe: refund theo payment_intent gốc, metadata reference và idempotency key cố định. Recovery retrieve/list đối chiếu reference; status succeeded mới ghi thành công. [API chính thức](https://docs.stripe.com/api/refunds/create).
- MoMo: ký request refund theo đặc tả; đối chiếu response hoặc query original order để tìm đúng refund reference trong refundTrans. Lỗi/timeout không giải phóng ngân sách. [Refund/query](https://developers.momo.vn/v3/docs/payment/api/payment-api/refund/).
- ZaloPay: reference yymmdd_appid_identifier được lưu trước request. Acknowledgement chỉ processing; query cùng m_refund_id mới xác nhận settlement. [Refund](https://docs.zalopay.vn/vi/docs/specs/order-refund/), [query](https://docs.zalopay.vn/docs/specs/order-query-refund/).
- PayPal: refund capture gốc, PayPal-Request-Id và custom_id cố định; amount USD tính từ capture/rate đã lưu, cumulative rounding bảo toàn cents. Sau timeout không biết refund ID thì needs_review; lấy ID từ dashboard hoặc webhook đã xác minh rồi query, không tự POST khoản mới. [Refund capture](https://developer.paypal.com/api/payments/v2/captures-refund).
- COD: chỉ thành công sau admin ghi chứng từ trả tiền. Proof là nội dung/chứng từ tham chiếu nội bộ, không tự phát sinh giao dịch ngân hàng.

Webhook Stripe đọc raw body trước parse; MoMo/ZaloPay giữ chữ ký hiện có. PayPal `/wallet/paypal/webhook` gọi API verify-webhook-signature bằng PAYPAL_WEBHOOK_ID trước ghi inbox, sau đó query provider để xác nhận. [Xác minh PayPal](https://developer.paypal.com/api/webhooks/v1). Không dùng status/amount do browser gửi để kết luận đã thu/đã hoàn. Chỉ lưu provider/event/reference trong inbox, không lưu/log raw token/payload nhạy cảm.

Giới hạn thật của từng phương thức, khoản hoàn quá nhỏ, quyền refund của merchant, transport/schema response, signature/callback và thời gian settlement phải được kiểm lại trên sandbox được duyệt. Khoản PayPal nhỏ hơn một cent không tự tạo request số tiền 0; API báo cần đối soát. Chưa chứng minh sandbox thành công bằng việc các adapter/mock tests pass.

## Schema và migration

Hai migration Phase 4, **chưa áp dụng cloud**:

1. `20261021121806_phase4_fulfillment_returns_jobs`: fulfillment_command, order_fulfillment, shipment_event; order_allocation; sales_return/item/event; refund/attempt; webhook_inbox; outbox; job_lease. Backfill mốc cũ và phân bổ từ số đã lưu, không đổi tồn/chứng từ.
2. `20261021124735_phase4_cleanup_refund_retry`: upload_asset.checked_at và unique refund/return có điều kiện chưa failed để hỗ trợ retry sau thất bại dứt điểm.

Giữ `server/src/database/schema.js` làm nguồn; không dùng schema-new. Mốc lịch sử fallback gắn provenance `legacy_completed_fallback`; ledger issue ngoài trạng thái completed cũng được đánh dấu để ngăn trừ lại. Nhiều shipment, nhiều khoản thu, chứng từ không thể phân bổ hoặc trạng thái refund cũ thiếu ledger phải đối soát có audit, không tự sửa/xóa hoặc suy đoán phần tiền chưa hoàn.

Runbook:

1. Chạy `deno task audit:phase12`, `audit:phase3`, `audit:phase4` chỉ đọc; kiểm schema/history, orphan/duplicate, chứng từ và mốc tồn. Lưu report bảo mật theo môi trường.
2. Chốt snapshot/backup, deployment tương thích và phạm vi migration/database cụ thể. Cloud hiện chưa có bảng Phase 4; các migration Phase 1–3 còn pending theo lịch sử audit trước. Apply toàn bộ phần pending cần phê duyệt riêng, không dùng phê duyệt migration cũ.
3. Sau khi được duyệt mới `deno task --cwd server db:migrate` theo thứ tự; không reset/db:push/migration trong build/request. Chạy lại audit, đối chiếu balance/reservation/ledger, tổng allocation, trường hợp legacy fallback và refund flags. Chênh lệch chỉ sửa bằng nghiệp vụ có lý do/audit.
4. Deploy code, cấu hình scheduler rồi nghiệm thu bằng fixtures/sandbox được duyệt. Không mở job live với merchant credentials trước khi chốt phạm vi.
5. Rollback ưu tiên tắt scheduler/feature và deployment tương thích, giữ bảng mới và dữ liệu/ledger. Không down migration phá dữ liệu; code rollback không hoàn tác giao dịch provider. Không đưa public catalog về bản lộ trường nội bộ.

Audit cloud **READ ONLY** trong đợt này: transaction_read_only=on, 0 multiple shipments, 0 multiple completed collections, 0 invalid documents, 0 historical issue/fallback/refund flags, 0 paid_late; chưa có bảng Phase 4. Đây là kiểm tra hiện trạng, không phải apply migration hoặc test ghi cloud.

## Cấu hình scheduler và triển khai

- `INTERNAL_JOB_SECRET`: secret server-only tối thiểu 32 ký tự ngẫu nhiên, lưu cùng giá trị trong secret store của scheduler; không VITE_*, không URL query, không commit giá trị thật.
- Scheduler HTTPS ngoài: POST backend `/internal/jobs/dispatch` và `/internal/jobs/checkout` mỗi phút; POST `/internal/jobs/images` hàng giờ. Header `Authorization: Bearer <secret>`, body `{}`, timeout khoảng 60 giây. Có thể retry cùng job; lease/claim/idempotency xử lý trùng. Job đang chạy/chưa đến giờ trả skipped; lỗi job trả 503 để scheduler nhận biết.
- `server/vercel.mjs` đặt maxDuration=60 cho src/index.js; batch dùng deadline 45 giây, không tạo timer trong startup. Cần xác nhận cấu hình thực được áp dụng khi deploy. [Cấu hình duration](https://vercel.com/docs/functions/configuring-functions/duration).
- Giữ merchant env hiện có, cấu hình thêm PAYPAL_WEBHOOK_ID nếu dùng webhook PayPal; đăng ký URL webhook HTTPS đúng môi trường. SMTP giữ EMAIL_USER/EMAIL_APSS/EMAIL_FROM; transport có timeout và thư giao dịch đi qua outbox.
- Thanh toán paid_late giữ nguyên dấu lịch sử, nhưng bỏ yêu cầu hỗ trợ/metadata requiresRefund sau khi hồ sơ hủy có hoàn tiền đã thành công.
- Admin → Đơn hàng: dashboard quan sát backlog/lỗi/lần chạy, paid_late và hồ sơ mở; Xem đơn → Vận chuyển/trả hàng/hoàn tiền để xử lý. Chủ đơn mở chi tiết đơn ở `/purchase?orderId=...` để gửi/đọc hồ sơ.

## Tests, build, lint và giới hạn

| Kiểm tra | Kết quả |
| --- | --- |
| `deno task test` | Client **24 passed**; server **116 passed / 78 opt-in skipped** |
| `deno task test:postgres` | **74 passed**: 19 Phase 1, 8 Phase 2, 10 checkout, 8 Phase 3, 28 Phase 4, 1 native auth; runner tạo/xóa PostgreSQL 17 localhost |
| `deno task test:e2e` | 5 suite: admin/upload/cart/review/statistics; 6 checkout scenarios; catalog; Phase 3 auth/orders; Phase 4 shipment → mobile partial return/error retry → approve/receive/inspect/restock/COD refund/complete |
| `deno task build` | Client/server PASS |
| Server lint + scripts thay đổi, ESLint client trong phạm vi | PASS, không thêm disable rule để che lỗi |
| `deno task --cwd server db:check` | PASS |
| Root lint | **2103 errors / 32 warnings** cũ ngoài phạm vi, giữ cho Phase 6 |

Runner PostgreSQL ép DATABASE_URL localhost do chính nó tạo; không dùng cloud làm fixtures. Provider/SMTP/S3 trong test được mock; chỉ tính concurrency khi đã chạy PostgreSQL thật. Ba audit scripts được kiểm chứng READ ONLY trên cluster tạm; chỉ audit Phase 4 READ ONLY chạy thêm trên cloud trong đợt này. Log kiểm thử: `/tmp/laptop-phase4-*.log`; report cloud chỉ đọc: `/tmp/laptop-phase4-cloud-readonly-audit.json`, không chứa secret.

Files chính: `server/src/services/fulfillment.js`, `refund-gateways.js`, `jobs.js`; `schemas/fulfillment.js`, `routes/fulfillment.js`, `lib/orders/refund-allocation.js`, schema/migrations; các điểm tích hợp checkout/order/payment gateways/wallet/statistics/catalog/storage/mailer. Frontend dùng `components/block/order-fulfillment.jsx`, admin order detail/operations, customer order panel và trạng thái/refund statistics. `scripts/audit-phase4.mjs`, PostgreSQL runner, provider/allocation/HTTP/browser tests ghi bằng chứng riêng.

Chưa deploy, chưa apply migration cloud, chưa gửi email/xóa object thật, chưa chạy refund/payment thật hay scheduler ngoài. Phase 5–6 vẫn TODO và cần phê duyệt riêng.
