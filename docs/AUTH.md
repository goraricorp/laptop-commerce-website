# Better Auth 1.7.10 và Drizzle RC

Auth dùng Better Auth 1.7.10 và Drizzle ORM/Kit 1.0.0-rc.4 đã cài trong dự án. API Relations v2 phù hợp với dòng RC từ rc.1; không hạ phiên bản package.

## Cấu trúc

- `src/lib/auth/options.js`: cấu hình package, plugin username, Admin, Email OTP và callback gửi email.
- `src/lib/auth/index.js`: Better Auth với `@better-auth/drizzle-adapter/relations-v2`.
- `src/database/auth-schema.js`: schema sinh bằng CLI `auth@1.7.10`, giữ enum `user.role`, dùng timestamp có múi giờ.
- `src/database/schema.js`: schema nghiệp vụ, re-export schema auth để các module cũ tiếp tục import được.
- `src/database/index.js`: `drizzle({ client, relations })`, ghép full relations trước partial auth relations theo docs RC.

Bốn role được giữ nguyên: `user`, `moderator`, `administrator`, `master`. Admin plugin quản lý trường role và chặn người dùng tự cấp role. `administrator` có quyền xem user và xem/thu hồi session; `master` có quyền quản lý user theo Admin plugin. Giới hạn này ngăn administrator sửa tài khoản master hoặc tự cấp master mà không phải viết lại endpoint auth. Middleware role ở route nghiệp vụ chỉ kiểm tra quyền truy cập tính năng của ứng dụng.

Username dùng plugin mặc định: 3–30 ký tự, chữ/số/gạch dưới/dấu chấm, chuẩn hoá chữ thường; `displayUsername` lưu tên trước chuẩn hoá. User cũ có thể để null và thiết lập username qua cập nhật hồ sơ. Đăng nhập hỗ trợ email hoặc username.

Hash mật khẩu, OTP, token reset, session, CSRF, origin check và rate limit do Better Auth xử lý. OTP giữ cấu hình mặc định về thời hạn/số lần thử; lưu hash thay vì mã thô. UI không tự khoá OTP hoặc tự quyết định mã hết hạn. Rate limit bật trong mọi môi trường và lưu vào bảng `rate_limit`.

Các route/service/controller CRUD trực tiếp user/account/session/verification đã được gỡ. Quản trị user ở client gọi `authClient.admin.*`. Không còn màn hình duyệt toàn bộ account, password hash và verification. Session của chính người dùng vẫn dùng API Better Auth; quản trị session theo từng user có API Admin plugin.

Mailer và giao diện là phần tích hợp của ứng dụng; callback email được await, không tự nuốt lỗi gửi thư. Test mock mailer nên không xác minh việc gửi SMTP thực tế.

## Biến môi trường

Đọc trực tiếp `process.env` trên server, `import.meta.env` ở client. Không có secret dự phòng. Server yêu cầu `DATABASE_URL`, `BETTER_AUTH_SECRET` (ít nhất 32 ký tự), `VITE_PUBLIC_SERVER_URL`, `VITE_PUBLIC_CLIENT_URL`. Client dùng `VITE_PUBLIC_SERVER_URL` làm API origin trực tiếp; Better Auth chạy tại `<API origin>/auth`. Hai project Vercel hiện dùng `https://example-client.vercel.app` và `https://example-server.vercel.app`; đặt cả `VITE_PUBLIC_CLIENT_URL` lẫn `VITE_PUBLIC_SERVER_URL` trong môi trường build của cả client và server. Server đặt `BETTER_AUTH_URL=https://example-server.vercel.app/auth`. Production đặt cookie auth `SameSite=None; Secure` để hỗ trợ request credentialed giữa hai origin. Hai hostname `vercel.app` này vẫn là cross-site; Safari ITP và các trình duyệt chặn third-party cookie có thể chặn đăng nhập. Muốn hỗ trợ các trình duyệt đó cần chuyển sang hai custom domain cùng site hoặc thêm proxy cùng origin. Mailer sử dụng `EMAIL_USER`, `EMAIL_APSS` qua cấu hình Nodemailer `service: gmail`; không cấu hình host/port riêng. Gmail preset vẫn sử dụng SMTP bên dưới.

## Schema và cloud

Đã sinh schema bằng:

```sh
pnpm dlx auth@1.7.10 generate --config ./src/lib/auth/index.js --output /tmp/better-auth-generated.ts --yes
```

File sinh ra cần được review/ghép vào `auth-schema.js`, giữ enum role và các tuỳ chỉnh timestamp. Không ghi đè schema nghiệp vụ bằng output CLI.

Migration RC mới nằm trong `src/database/migrations-v2`; thư mục lịch sử cũ được giữ nguyên và không còn là đầu vào Drizzle Kit. Baseline mới dành cho database trống, không chạy baseline bằng `db:migrate` trên database đã tạo cấu trúc bằng `db:push`. Không chạy chuỗi migration Supabase cũ trên Neon.

```sh
pnpm db:generate
pnpm exec drizzle-kit push --explain
pnpm db:push
```

Đã kiểm tra SQL và push lên Neon cấu hình trong `server/.env.local`. Lúc kiểm tra, kế hoạch chỉ tạo schema mới, không có DROP/TRUNCATE. Không dùng `--force`.

## Kiểm tra

```sh
pnpm --dir server test
pnpm --dir client test
# Chạy từ server, chủ động bật test ghi cloud:
RUN_CLOUD_AUTH_TESTS=true pnpm exec vitest run tests/auth-cloud.test.js
```

Test mặc định dùng memory adapter chính thức và mock mailer. Test cloud tạo tài khoản `auth-vitest-...@example.com`, kiểm tra adapter thật/quan hệ/session rồi xoá tài khoản thử cùng account/session qua cascade. Không gửi email thật. Cloud test mặc định bị bỏ qua.

## Tài liệu đối chiếu

- https://better-auth.com/docs/adapters/drizzle
- https://better-auth.com/docs/plugins/username
- https://better-auth.com/docs/plugins/admin
- https://better-auth.com/docs/plugins/email-otp
- https://better-auth.com/docs/guides/1-7-upgrade-guide
- https://orm.drizzle.team/docs/relations
- https://github.com/drizzle-team/drizzle-orm/releases/tag/v1.0.0-rc.1
