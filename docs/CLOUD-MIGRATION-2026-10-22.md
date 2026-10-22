# Cloud migration và kiểm tra schema/API — 22/10/2026

**DONE migration/schema và API đọc kết nối cloud.** Người dùng đã duyệt áp dụng migration trên database cấu hình trong `server/.env.local`. Đích là Neon `neondb`, host prefix `ep-wandering-moon-b3aw8glb-pooler`; không thay file secret.

## Migration đã áp dụng

Chạy `deno run db:migrate` trong `server`, dùng Drizzle migrate. Không reset, db:push, seed hoặc chỉnh tồn kho/chứng từ thủ công.

1. `20261021032042_phase1_catalog_inventory`
2. `20261021090928_phase2_storefront`
3. `20261021114844_phase3_orders_oauth`
4. `20261021121806_phase4_fulfillment_returns_jobs`
5. `20261021124735_phase4_cleanup_refund_retry`
6. `20261021160233_phase5_accounts_support_editor`
7. `20261021162135_phase5_private_support_assets`
8. `20261021162726_phase5_support_indexes`
9. `20261021165401_phase6_express_sessions`

History hiện có **13 migration**, tên/hash khớp toàn bộ file đang có; không còn migration pending. Migration tạo baseline/reservation và phân bổ/mốc giao cho lịch sử theo SQL đã duyệt, không phát sinh thanh toán hoặc hoàn tiền ngoài hệ thống.

## Schema và tính toàn vẹn

Audit trước/sau đều dùng transaction READ ONLY. Đối chiếu snapshot cuối `20261021165401_phase6_express_sessions/snapshot.json`:

| Kiểm tra | Kết quả |
| --- | --- |
| Bảng/cột | 61 bảng, 512 cột; đúng tên, kiểu và nullability |
| Enum | 24 enum; đúng giá trị/thứ tự |
| Index | 51 index yêu cầu; hiện diện, valid, đúng unique/method/cột |
| Constraint | 190 PK/FK/unique/check yêu cầu hiện diện và validated |
| Trigger tùy chỉnh | account_active_owner, session_active_owner, user_tombstone_immutable hiện diện và enabled |
| Query auth | Projection toàn bộ cột user, session và two_factor biên dịch thành công; đã có two_factor_enabled/anonymized_at |
| Số tồn | Hash aggregate balance trước/sau giống nhau; không thay onHand/reserved |
| Audit Phase 1–6 | Không có invalid balance/constraint, reservation drift, orphan hoặc duplicate trong các mục kiểm tra; không refund overage/allocation mismatch, invalid 2FA/assignee hoặc anonymized account còn session |

Kiểm tra constraint/index ở đây xác minh metadata nêu trên; không thay thế mọi kiểm thử concurrency/nghiệp vụ hoặc sandbox provider.

## API đã chạy thật

`server/scripts/verify-cloud-api.mjs` khởi động Vite trên cổng localhost ngẫu nhiên, mount Express bằng cấu hình hiện tại và kết nối database cloud. Script ép `PGOPTIONS default_transaction_read_only=on` cho mọi connection và kiểm tra lại mode thực tế.

Chạy trong `server`:

```sh
deno run -A scripts/verify-cloud-api.mjs --read-only
```

**17 HTTP checks PASS**:

- 200: health, catalog search/campaigns/spotlight/category/brand, chi tiết sản phẩm thật, review summary, auth/providers.
- 401: cart/orders/favorites/preferences của khách, admin statistics/catalog và checkout quote khi chưa đăng nhập.
- 400: catalog query không hợp lệ.

Better Auth native adapter lookup user bằng email fixture không tồn tại và native API đọc session không có cookie đều PASS. Lỗi thiếu `user.two_factor_enabled` trong log trước đó đã được xử lý ở database và projection thật của adapter.

Không gọi HTTP `/auth/get-session` trong probe READ ONLY vì Better Auth ghi rate-limit counter ngay cả với GET. Lần thử route này trong probe bị PostgreSQL READ ONLY từ chối, không phải schema thiếu. Không thay cấu hình auth để né rate limit. Chưa kiểm thử đăng nhập thật với mật khẩu/OTP/Google hoặc API admin có phiên đăng nhập; không tạo user, session, đơn, refund hoặc fixtures cloud.

Đây là **localhost Vite/Express → database cloud**, chưa phải deployment Vercel hoặc kiểm thử SMTP/S3/payment/scheduler thật.

## Bản chụp và giới hạn

Lưu metadata schema trước migration và hash aggregate tồn kho ngoài repository ở `/private/tmp/laptop-cloud-before-schema.json` và `/private/tmp/laptop-cloud-before-balances.json`; các file tạm không phải bản sao dữ liệu để phục hồi đầy đủ.

Automatic approval review từ chối đề xuất xuất toàn bộ dữ liệu cloud ra local vì có thể chứa payload nhạy cảm, vượt phạm vi duyệt migration/schema/API. Không thực hiện export đó hoặc lách bằng phương án xuất dữ liệu khác; không có bản backup toàn bộ dữ liệu local được tạo trong đợt này.

Sau migration, ưu tiên rollback deployment tương thích và giữ schema mới; không down migration phá dữ liệu. Những giới hạn deployment/provider/Google/SMTP/bucket policy/scheduler vẫn cần được nghiệm thu riêng.
