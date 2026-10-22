import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  authClient: {
    signIn: { email: vi.fn(), username: vi.fn() },
    signUp: { email: vi.fn() },
    emailOtp: { sendVerificationOtp: vi.fn(), verifyEmail: vi.fn() },
  },
}));

import { authClient } from "@/lib/auth";
import {
  loginWithEmail,
  registerWithEmail,
  verifyEmailOtp,
} from "@/services/auth";
import { signUpSchema } from "@/schemas/auth";

beforeEach(() => vi.resetAllMocks());

describe("client delegates authentication to Better Auth SDK", () => {
  it("routes email login and username login to the respective SDK methods", async () => {
    const response = { data: { user: { id: "test-id" } }, error: null };
    authClient.signIn.email.mockResolvedValue(response);
    authClient.signIn.username.mockResolvedValue(response);
    await loginWithEmail({
      email: "test@example.com",
      password: "test-password",
      rememberMe: true,
    });
    await loginWithEmail({
      email: "Test.User",
      password: "test-password",
      rememberMe: false,
    });
    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "test-password",
      rememberMe: true,
    });
    expect(authClient.signIn.username).toHaveBeenCalledWith({
      username: "Test.User",
      password: "test-password",
      rememberMe: false,
    });
  });

  it("passes username through the standard email registration API", async () => {
    authClient.signUp.email.mockResolvedValue({
      data: { user: { username: "test.user" } },
      error: null,
    });
    const data = {
      email: "test@example.com",
      username: "test.user",
      name: "Test",
      password: "test-password",
    };
    expect(await registerWithEmail(data)).toMatchObject({
      user: { username: "test.user" },
    });
    expect(authClient.signUp.email).toHaveBeenCalledWith(data);
  });

  it("preserves package OTP error codes for the UI", async () => {
    authClient.emailOtp.verifyEmail.mockResolvedValue({
      data: null,
      error: { message: "OTP expired", code: "OTP_EXPIRED", status: 400 },
    });
    await expect(
      verifyEmailOtp({ email: "test@example.com", otp: "123456" }),
    ).rejects.toMatchObject({ code: "OTP_EXPIRED", status: 400 });
  });

  it("validates username syntax and the default maximum password length before submission", () => {
    const values = {
      email: "test@example.com",
      username: "test.user",
      name: "Test",
      password: "test-password",
      confirmPassword: "test-password",
    };
    expect(signUpSchema.safeParse(values).success).toBe(true);
    expect(
      signUpSchema.safeParse({ ...values, username: "bad name!" }).success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({
        ...values,
        password: "x".repeat(129),
        confirmPassword: "x".repeat(129),
      }).success,
    ).toBe(false);
  });
});
