import {request as httpRequest} from './helpers/request.js';
import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  store: {
    user: [],
    session: [],
    account: [],
    verification: [],
    rateLimit: [],
  },
}));
vi.mock("../src/lib/utils/environment.js", async (importOriginal) => ({
  ...(await importOriginal()),
  clientUrl: "https://shop.example",
  betterAuthUrl: "https://backend.example/auth",
  betterAuthApiKey: undefined,
  betterAuthSecret: "express-http-memory-test-secret-at-least-32-characters",
}));
vi.mock("../src/lib/email/mailer.js", () => ({
  sendVerificationOtpEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendDeleteAccountEmail: vi.fn(),
}));
vi.mock("../src/lib/auth/index.js", async () => {
  const { betterAuth } = await import("better-auth");
  const { memoryAdapter } = await import("better-auth/adapters/memory");
  const { authOptions } = await import("../src/lib/auth/options.js");
  return {
    auth: betterAuth({ ...authOptions, database: memoryAdapter(state.store) }),
  };
});
import AppModule from "../src/module.js";
import { sendVerificationOtpEmail } from "../src/lib/email/mailer.js";
let app;
const credentials = {
  name: "Express memory fixture",
  email: "express@example.test",
  username: "express.fixture",
  password: "secure-express-fixture-123",
};
const request = (path, body, cookie, origin = "https://shop.example") =>
  httpRequest(app,`https://backend.example/auth${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      origin,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(state.store)) state.store[key].length = 0;
  app = AppModule();
});
describe("actual Better Auth on the Express /auth endpoint (memory database)", () => {
  it("registers, verifies OTP, signs in, forwards cookies and revokes the session", async () => {
    expect((await request("/ok")).status).toBe(200);
    const signup = await request("/sign-up/email", credentials);
    expect(signup.status).toBe(200);
    const { otp } = sendVerificationOtpEmail.mock.calls.at(-1)[0];
    expect(
      (
        await request("/email-otp/verify-email", {
          email: credentials.email,
          otp,
        })
      ).status,
    ).toBe(200);
    const login = await request("/sign-in/username", {
      username: credentials.username,
      password: credentials.password,
    });
    expect(login.status).toBe(200);
    const cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    expect(cookie).toContain("session_token=");
    expect(login.headers.get("set-cookie")).toContain("HttpOnly");
    expect(
      (await (await request("/get-session", undefined, cookie)).json()).user
        .email,
    ).toBe(credentials.email);
    expect((await request("/sign-out", {}, cookie)).status).toBe(200);
    expect(
      await (await request("/get-session", undefined, cookie)).json(),
    ).toBeNull();
  });
  it("preserves trusted origin enforcement and does not expose account table CRUD", async () => {
    expect(
      (
        await request(
          "/sign-up/email",
          credentials,
          undefined,
          "https://evil.example",
        )
      ).status,
    ).toBe(403);
    expect((await request("/account")).status).toBe(404);
    expect(state.store.user).toHaveLength(0);
  });
});
