export function safeAuthRedirect(value, fallback = "/") {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    ![...value].some((char) => char.charCodeAt(0) < 32)
    ? value
    : fallback;
}
const messages = {
  account_not_linked:
    "Email này đã có tài khoản. Hãy đăng nhập bằng phương thức hiện có, rồi liên kết Google trong Tài khoản đã kết nối.",
  email_does_not_match:
    "Email Google phải trùng với email tài khoản đã xác minh.",
  account_already_linked_to_different_user:
    "Google này đã được liên kết với tài khoản khác.",
  access_denied: "Bạn đã hủy hoặc từ chối quyền đăng nhập Google.",
  SESSION_NOT_FRESH:
    "Phiên xác minh đã hết hạn. Vui lòng đăng nhập lại rồi thử liên kết.",
  LINK_SESSION_CHANGED: "Phiên đăng nhập đã thay đổi. Vui lòng bắt đầu lại.",
  GOOGLE_EMAIL_NOT_VERIFIED: "Google chưa xác minh email của tài khoản này.",
  LOCAL_EMAIL_NOT_VERIFIED: "Hãy xác minh email tài khoản trước khi liên kết.",
  state_mismatch:
    "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
  state_not_found:
    "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
};
export function oauthErrorMessage(code) {
  return (
    (typeof code === "string" && Object.hasOwn(messages, code)
      ? messages[code]
      : undefined) ??
    "Không thể hoàn tất đăng nhập/liên kết Google. Vui lòng thử lại."
  );
}
