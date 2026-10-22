import { request as httpRequest } from "./helpers/request.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { PgDialect } from "drizzle-orm/pg-core";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  auth: vi.fn(),
  execute: vi.fn(),
  insert: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  quote: vi.fn(),
  place: vi.fn(),
  notify: vi.fn(),
  stripe: vi.fn(),
  verifyMomo: vi.fn(),
}));
vi.mock("../src/lib/auth/index.js", () => ({
  auth: { api: { getSession: mocks.session }, handler: mocks.auth },
}));
vi.mock("../src/lib/utils/environment.js", async (importOriginal) => ({
  ...(await importOriginal()),
  clientUrl: "http://localhost:5173",
  serverUrl: "http://127.0.0.1:5172",
  betterAuthUrl: "http://127.0.0.1:5172/auth",
  stripeWebhookSecret: "test-webhook-secret",
}));
vi.mock("../src/database/index.js", () => ({
  db: {
    execute: mocks.execute,
    transaction: async (action) =>
      action({
        select: () => ({
          from: () => ({
            where: () => ({
              for: async () => [
                { id: "00000000-0000-4000-8000-000000000001", banned: false },
              ],
            }),
          }),
        }),
        insert: () => ({ values: mocks.insert }),
      }),
    select: () => ({ from: async () => [] }),
    insert: () => ({ values: mocks.insert }),
  },
}));
vi.mock("../src/services/jobs.js", () => ({
  receiveWebhook: mocks.notify,
  operationsSummary: vi.fn(),
  runJob: vi.fn(),
}));
vi.mock("../src/services/checkout.js", () => ({
  quoteCheckout: mocks.quote,
  placeCheckout: mocks.place,
  handleGatewayNotification: mocks.notify,
  listCustomerOrders: vi.fn(),
  getCustomerOrder: vi.fn(),
  initiatePayment: vi.fn(),
  refreshPayment: vi.fn(),
  cancelCheckout: vi.fn(),
  finishCheckoutOrder: vi.fn(),
}));
vi.mock("../src/services/payment-gateways.js", () => ({
  paymentMethods: () => [],
  getStripe: () => ({ webhooks: { constructEvent: mocks.stripe } }),
  verifyMomoCallback: mocks.verifyMomo,
  verifyZaloCallback: () => false,
}));
vi.mock("../src/lib/upload/s3-client.js", () => ({
  uploadObject: mocks.upload,
  deleteObject: mocks.remove,
  getObjectUrl: async () => "https://bucket.example/signed",
}));
import AppModule from "../src/module.js";
import { rateLimit, consumeRateLimit } from "../src/middlewares/rate-limit.js";

const owner = "00000000-0000-4000-8000-000000000001";
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]);
let app;
const jsonRequest = (path, body, extra = {}) =>
  httpRequest(app, path, {
    method: "POST",
    headers: { cookie: "user", "content-type": "application/json", ...extra },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockImplementation(async ({ headers }) =>
    headers.get("cookie")
      ? {
          user: {
            id: owner,
            role: headers.get("cookie") === "admin" ? "administrator" : "user",
          },
        }
      : null,
  );
  mocks.execute.mockResolvedValue({
    rows: [{ count: 1, last_request: Date.now() }],
  });
  mocks.quote.mockResolvedValue({ grandTotal: 120000 });
  mocks.place.mockResolvedValue({ order: { id: owner } });
  mocks.auth.mockImplementation(
    async (request) =>
      new Response(
        JSON.stringify({
          path: new URL(request.url).pathname,
          body: await request.text(),
        }),
        {
          headers: {
            "content-type": "application/json",
            "set-cookie": "session=opaque; HttpOnly; Path=/; SameSite=Lax",
          },
        },
      ),
  );
  mocks.verifyMomo.mockReturnValue(false);
  mocks.stripe.mockReturnValue({
    id: "evt_fixture",
    type: "checkout.session.completed",
    data: { object: { id: "cs_test" } },
  });
  app = AppModule();
});
describe("Express HTTP contracts without external side effects", () => {
  it("serves health and errors without querying PostgreSQL", async () => {
    expect((await httpRequest(app, "/health")).status).toBe(200);
    expect((await httpRequest(app, "/missing")).status).toBe(404);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it.each([
    "/inventory/location",
    "/inventory/location/hidden",
    "/order/sale",
    "/order/sale/hidden",
    "/admin/statistics",
    "/admin/statistics/orders/hidden",
    "/me/addresses",
    "/me/addresses/hidden",
    "/me/cart",
    "/me/orders",
    "/me/reviews",
  ])("protects both exact and nested route %s", async (path) => {
    expect((await httpRequest(app, path)).status).toBe(401);
  });
  it("enforces roles on native middleware before accessing admin data", async () => {
    expect(
      (
        await httpRequest(app, "/inventory/location", {
          headers: { cookie: "user" },
        })
      ).status,
    ).toBe(403);
    const admin = await httpRequest(app, "/inventory/location", {
      headers: { cookie: "admin" },
    });
    expect(admin.status).toBe(200);
    expect(await admin.json()).toMatchObject({ items: [] });
  });
  it("restores the public auth path and forwards the raw body and Set-Cookie", async () => {
    const result = await jsonRequest("/auth/sign-in/email", {
      email: "test@example.com",
    });
    expect(await result.json()).toEqual({
      path: "/auth/sign-in/email",
      body: '{"email":"test@example.com"}',
    });
    expect(result.headers.get("set-cookie")).toContain("HttpOnly");
  });
  it("preserves checkout status, authenticated owner, JSON and no-store", async () => {
    const body = { requestKey: owner };
    const result = await jsonRequest("/checkout/orders", body, {
      origin: "http://localhost:5173",
    });
    expect(result.status).toBe(201);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(mocks.place).toHaveBeenCalledWith(owner, body);
    expect((await jsonRequest("/checkout/quote", {})).status).toBe(200);
    expect(
      (
        await jsonRequest(
          "/checkout/quote",
          {},
          { origin: "https://evil.example" },
        )
      ).status,
    ).toBe(403);
    expect(mocks.quote).toHaveBeenCalledOnce();
  });
  it("rejects malformed and oversized bodies before checkout", async () => {
    expect(
      (
        await httpRequest(app, "/checkout/orders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await httpRequest(app, "/checkout/orders", {
          method: "POST",
          body: "x".repeat(4_100_001),
        })
      ).status,
    ).toBe(413);
    expect(mocks.place).not.toHaveBeenCalled();
  });
  it("verifies exact Stripe raw bytes and rejects bad signatures", async () => {
    const payload = '{ "type": "checkout.session.completed" }\n';
    const result = await httpRequest(app, "/wallet/stripe/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "signed",
      },
      body: payload,
    });
    expect(result.status).toBe(200);
    expect(mocks.stripe).toHaveBeenCalledWith(
      Buffer.from(payload),
      "signed",
      "test-webhook-secret",
    );
    expect(mocks.notify).toHaveBeenCalledWith(
      "stripe",
      "evt_fixture",
      "cs_test",
    );
    mocks.stripe.mockImplementationOnce(() => {
      throw new Error("signature");
    });
    expect((await jsonRequest("/wallet/stripe/webhook", {})).status).toBe(400);
    expect(mocks.notify).toHaveBeenCalledOnce();
  });
  it("keeps signed provider callbacks independent of browser sessions", async () => {
    expect(
      (
        await httpRequest(app, "/wallet/momo/callback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        })
      ).status,
    ).toBe(400);
    mocks.verifyMomo.mockReturnValueOnce(true);
    expect(
      (
        await jsonRequest("/wallet/momo/callback", {
          orderId: "provider-order",
          signature: "signed-fixture",
        })
      ).status,
    ).toBe(204);
    expect(mocks.notify).toHaveBeenCalledWith(
      "momo",
      expect.any(String),
      "provider-order",
    );
  });
  it("uploads a validated UUID asset, preserving the response contract", async () => {
    const form = new FormData();
    form.append("file", new File([png], "sample.png", { type: "image/png" }));
    const result = await httpRequest(app, "/storage/upload", {
      method: "POST",
      headers: { cookie: "user" },
      body: form,
    });
    expect(result.status).toBe(201);
    const data = await result.json();
    expect(data.name).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(data.path).toBe(`public/users/${owner}/${data.name}`);
    expect(data.url).toContain("/api/storage/object?key=");
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ userId: owner }),
    );
  });
  it("compensates object upload when the manifest insert fails", async () => {
    mocks.insert.mockRejectedValueOnce(
      Object.assign(new Error("database unavailable"), { status: 503 }),
    );
    const form = new FormData();
    form.append("file", new File([png], "sample.png", { type: "image/png" }));
    expect(
      (
        await httpRequest(app, "/storage/upload", {
          method: "POST",
          headers: { cookie: "user" },
          body: form,
        })
      ).status,
    ).toBe(503);
    expect(mocks.remove).toHaveBeenCalledOnce();
  });
  it("accepts an image exactly at the inclusive 4,000,000-byte limit", async () => {
    const bytes = new Uint8Array(4_000_000);
    bytes.set(png);
    const form = new FormData();
    form.append("file", new File([bytes], "limit.png", { type: "image/png" }));
    const result = await httpRequest(app, "/storage/upload", {
      method: "POST",
      headers: { cookie: "user" },
      body: form,
    });
    expect(result.status).toBe(201);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ size: 4_000_000 }),
    );
  });
  it("rejects malformed multipart before writing an object", async () => {
    const result = await httpRequest(app, "/storage/upload", {
      method: "POST",
      headers: {
        cookie: "user",
        "content-type": "multipart/form-data; boundary=broken",
      },
      body: '--broken\r\nContent-Disposition: form-data; name="file"; filename="x.png"\r\n',
    });
    expect(result.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it.each(["second file", "unexpected field"])(
    "rejects multipart containing a %s before uploading",
    async (extra) => {
      const form = new FormData();
      form.append("file", new File([png], "sample.png", { type: "image/png" }));
      if (extra === "second file")
        form.append(
          "file",
          new File([png], "extra.png", { type: "image/png" }),
        );
      else form.append("ownerId", "another-user");
      const result = await httpRequest(app, "/storage/upload", {
        method: "POST",
        headers: { cookie: "user" },
        body: form,
      });
      expect(result.status).toBe(400);
      expect(mocks.upload).not.toHaveBeenCalled();
    },
  );
  it("rejects oversize and spoofed images before uploading", async () => {
    for (const file of [
      new File([new Uint8Array(4_000_001)], "big.png", { type: "image/png" }),
      new File(["not png"], "fake.png", { type: "image/png" }),
    ]) {
      const form = new FormData();
      form.append("file", file);
      const result = await httpRequest(app, "/storage/upload", {
        method: "POST",
        headers: { cookie: "user" },
        body: form,
      });
      expect([400, 413]).toContain(result.status);
    }
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("uses an atomic shared rate-limit upsert and independent scopes", async () => {
    await consumeRateLimit("test", 60000, 100000);
    const query = new PgDialect().sqlToQuery(mocks.execute.mock.calls[0][0]);
    expect(query.sql).toContain("on conflict(key) do update");
    const consume = vi
      .fn()
      .mockResolvedValue({ count: 3, last_request: Date.now() });
    const limited = express();
    limited.use(async (req, res, next) => {
      req.user = { id: owner };
      await next();
    });
    limited.use(
      rateLimit({ scope: "test", windowMs: 60000, limit: 2, consume }),
    );
    limited.get("/", (req, res) => res.json({ ok: true }));
    const result = await httpRequest(limited, "/");
    expect(result.status).toBe(429);
    expect(Number(result.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(consume.mock.calls[0][0]).not.toContain(owner);
  });
});
