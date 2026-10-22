import { z } from "zod";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
const fail = (code, message) => {
  throw new APIError("FORBIDDEN", { code, message });
};
export function assertAssured(current, { fresh = false } = {}) {
  if (!current?.session || !current.user)
    throw new APIError("UNAUTHORIZED", {
      code: "UNAUTHORIZED",
      message: "Vui lòng đăng nhập.",
    });
  if (current.user.twoFactorEnabled) {
    const at = new Date(current.session.secondFactorAt ?? 0).getTime();
    if (!at || at > Date.now())
      fail("TWO_FACTOR_REQUIRED", "Cần xác minh hai bước cho phiên này.");
    if (fresh && Date.now() - at >= 300000)
      fail(
        "SECOND_FACTOR_NOT_FRESH",
        "Xác minh lại mã hai bước trước thao tác này.",
      );
  }
  if (fresh) {
    const at = new Date(
      current.session.reauthenticatedAt ?? current.session.createdAt,
    ).getTime();
    if (
      !Number.isFinite(at) ||
      Date.now() - at < 0 ||
      Date.now() - at >= 300000
    )
      fail("SESSION_NOT_FRESH", "Vui lòng xác minh lại đăng nhập.");
  }
  return current;
}
const verificationPaths = new Set([
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
]);
const pendingAllowed = new Set([
  ...verificationPaths,
  "/get-session",
  "/sign-out",
]);
const sensitivePaths = new Set([
  "/change-password",
  "/set-password",
  "/change-email",
  "/email-otp/request-email-change",
  "/email-otp/change-email",
  "/link-social",
  "/two-factor/enable",
  "/two-factor/disable",
  "/two-factor/generate-backup-codes",
  "/two-factor/get-totp-uri",
]);
const adminProfile = z
  .object({
    name: z.string().trim().min(2).max(255).optional(),
    email: z.email().optional(),
    emailVerified: z.boolean().optional(),
    image: z.url().nullable().optional(),
    role: z.enum(["user", "moderator", "administrator", "master"]).optional(),
    username: z.string().min(3).max(30).optional(),
    displayUsername: z.string().max(30).optional(),
    firstName: z.string().max(255).nullable().optional(),
    lastName: z.string().max(255).nullable().optional(),
    phone: z.string().max(15).nullable().optional(),
    birthday: z.string().nullable().optional(),
  })
  .strict();
const adminSensitive=new Set(['/admin/create-user','/admin/update-user','/admin/set-role','/admin/ban-user','/admin/unban-user','/admin/remove-user','/admin/set-user-password','/admin/impersonate-user','/admin/revoke-user-session','/admin/revoke-user-sessions'])
export const assuranceBefore = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/admin/update-user") {
    const valid = adminProfile.safeParse(ctx.body?.data);
    if (!valid.success)
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_ADMIN_PROFILE",
        message:
          "Dữ liệu hồ sơ không hợp lệ; không sửa trường bảo mật qua form người dùng.",
      });
  }
  if (
    ["/delete-user", "/delete-user/callback", "/admin/remove-user"].includes(
      ctx.path,
    )
  )
    fail(
      "USE_ACCOUNT_ANONYMIZATION",
      "Xóa tài khoản qua nghiệp vụ ẩn danh để giữ chứng từ.",
    );
  if (
    ["/admin/set-role", "/admin/ban-user", "/admin/update-user"].includes(
      ctx.path,
    ) &&
    ctx.body?.userId
  ) {
    const target = await ctx.context.adapter.findOne({
      model: "user",
      where: [{ field: "id", value: ctx.body.userId }],
    });
    if (
      target?.role === "master" &&
      (ctx.path !== "/admin/update-user" ||
        (ctx.body.data.role && ctx.body.data.role !== "master"))
    )
      fail(
        "MASTER_HANDOFF_REQUIRED",
        "Master cần bàn giao qua nghiệp vụ tài khoản trước khi đổi quyền/vô hiệu hóa.",
      );
  }
  const current = await getSessionFromCtx(ctx, { disableCookieCache: true });
  if (
    current?.user?.twoFactorEnabled &&
    !current.session.secondFactorAt &&
    !pendingAllowed.has(ctx.path)
  )
    fail("TWO_FACTOR_REQUIRED", "Cần xác minh hai bước cho phiên này.");
  if (verificationPaths.has(ctx.path) && current?.user?.twoFactorEnabled) {
    const { consumeRateLimit } =
      await import("../../middlewares/rate-limit.js");
    const count = await consumeRateLimit(
      `auth:2fa-session:${current.user.id}`,
      900000,
    );
    if (count.count > 10)
      throw new APIError("TOO_MANY_REQUESTS", {
        code: "TOO_MANY_ATTEMPTS",
        message: "Quá nhiều lần xác minh. Thử lại sau 15 phút.",
      });
  }
  if (ctx.path.startsWith("/two-factor/")) {
    if (ctx.body?.trustDevice || ctx.body?.disableSession)
      fail(
        "TWO_FACTOR_SESSION_REQUIRED",
        "Xác minh gắn với phiên hiện tại; không sử dụng bỏ qua phiên/thiết bị tin cậy.",
      );
    if (ctx.body?.method && ctx.body.method !== "totp")
      fail("TOTP_REQUIRED", "Sử dụng ứng dụng TOTP để thiết lập hai bước.");
    if (
      ctx.path.includes("backup") &&
      !verificationPaths.has(ctx.path) &&
      ctx.path !== "/two-factor/generate-backup-codes"
    )
      fail("BACKUP_CODES_PRIVATE", "Không đọc lại mã khôi phục qua API.");
  }
  if (
    current &&
    (sensitivePaths.has(ctx.path) || adminSensitive.has(ctx.path))
  )
    assertAssured(current, { fresh: true });
});
export const assuranceAfter = createAuthMiddleware(async (ctx) => {
  const result = ctx.context.returned;
  if (!result || result instanceof APIError) return;
  if (!verificationPaths.has(ctx.path) && ctx.path !== "/verify-password")
    return;
  // Only successful plugin handlers reach these authenticated token/status results.
  if (verificationPaths.has(ctx.path) && !result.token && !result.user) return;
  if (ctx.path === "/verify-password" && result.status !== true) return;
  const current =
    ctx.context.newSession ??
    (await getSessionFromCtx(ctx, { disableCookieCache: true }));
  if (!current?.session) return;
  if (verificationPaths.has(ctx.path))
    await ctx.context.adapter.delete({
      model: "rateLimit",
      where: [{ field: "key", value: `auth:2fa-session:${current.user.id}` }],
    });
  await ctx.context.adapter.update({
    model: "session",
    where: [{ field: "id", value: current.session.id }],
    update: verificationPaths.has(ctx.path)
      ? { secondFactorAt: new Date() }
      : { reauthenticatedAt: new Date() },
  });
});
export async function sessionAssuranceBefore(data, ctx) {
  const verified = verificationPaths.has(ctx?.path);
  return {
    data: {
      ...data,
      secondFactorAt: verified ? new Date() : null,
      reauthenticatedAt: null,
    },
  };
}
