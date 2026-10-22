import { describe, expect, it } from "vitest";
import { safeAuthRedirect, oauthErrorMessage } from "../src/lib/auth/oauth";
describe("OAuth UI boundaries", () => {
  it("accepts local redirect paths and rejects external/backslash/control paths", () => {
    expect(safeAuthRedirect("/user/order?q=1")).toBe("/user/order?q=1");
    for (const value of [
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "/\n/evil.test",
      null,
    ])
      expect(safeAuthRedirect(value)).toBe("/");
  });
  it("explains email collisions and does not echo untrusted provider messages", () => {
    expect(typeof oauthErrorMessage("__proto__")).toBe("string");
    expect(oauthErrorMessage("account_not_linked")).toContain(
      "liên kết Google",
    );
    expect(oauthErrorMessage("<script>private payload</script>")).not.toContain(
      "private",
    );
  });
});
