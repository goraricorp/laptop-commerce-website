import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
const mock = vi.hoisted(() => ({
  stripe: { refunds: { create: vi.fn(), retrieve: vi.fn(), list: vi.fn() } },
}));
vi.mock("../src/services/payment-gateways.js", () => ({
  getStripe: () => mock.stripe,
}));
vi.mock("../src/lib/utils/environment.js", () => ({
  momoEndpoint: "https://test-payment.momo.vn/v2/gateway/api",
  momoSecretKey: "test-secret",
  momoAccessKey: "test-access",
  momoPartnerCode: "TEST",
  zalopayEndpoint: "https://sb-openapi.zalopay.vn/v2/create",
  zalopayKey1: "test-key",
  zalopayAppId: "123",
  paypalApiUrl: "https://api-m.sandbox.paypal.com",
  paypalClientId: "fixture",
  paypalClientSecret: "fixture",
  paypalWebhookId: "fixture-webhook",
}));
import {
  executeRefund,
  verifyPaypalWebhook,
} from "../src/services/refund-gateways.js";
const refund = {
    id: "refund-fixture",
    reference: "merchant-reference",
    provider: "stripe",
    providerAmount: "10000",
    currency: "VND",
  },
  payment = { transactionId: "pi_fixture" },
  session = { providerOrderId: "original-order" };
const ok = (value) => ({ ok: true, json: async () => value });
beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
describe("refund transports: only verified settlement succeeds", () => {
  it("Stripe uses original intent + stable idempotency key and validates correlation", async () => {
    mock.stripe.refunds.create.mockResolvedValue({
      id: "re_1",
      status: "succeeded",
      payment_intent: "pi_fixture",
      amount: 10000,
      currency: "vnd",
      metadata: { refund_reference: refund.reference },
    });
    expect(
      await executeRefund(refund, payment, session, { submit: true }),
    ).toMatchObject({
      state: "succeeded",
      verified: true,
      reference: refund.reference,
    });
    expect(mock.stripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_fixture", amount: 10000 }),
      { idempotencyKey: refund.reference },
    );
    mock.stripe.refunds.create.mockResolvedValue({
      id: "re_wrong",
      status: "succeeded",
      payment_intent: "pi_other",
      amount: 10000,
      currency: "vnd",
    });
    expect(
      (await executeRefund(refund, payment, session, { submit: true })).state,
    ).toBe("needs_review");
  });
  it("Stripe timeout recovery queries matching reference; it never creates a second refund", async () => {
    mock.stripe.refunds.list.mockResolvedValue({ data: [] });
    expect((await executeRefund(refund, payment, session)).state).toBe(
      "needs_review",
    );
    expect(mock.stripe.refunds.create).not.toHaveBeenCalled();
  });
  it("MoMo signs refund and queries original order to locate the same refund reference", async () => {
    const fetcher = vi.fn(async (url, options) => {
      const b = JSON.parse(options.body);
      if (url.endsWith("/refund")) {
        const expected = createHmac("sha256", "test-secret")
          .update(
            `accessKey=test-access&amount=10000&description=${b.description}&orderId=merchant-reference&partnerCode=TEST&requestId=merchant-reference&transId=pi_fixture`,
          )
          .digest("hex");
        expect(b.signature).toBe(expected);
        return ok({
          partnerCode: "TEST",
          orderId: b.orderId,
          requestId: b.requestId,
          amount: 10000,
          transId: 123,
          resultCode: 0,
        });
      }
      expect(b.orderId).toBe("original-order");
      return ok({
        partnerCode: "TEST",
        orderId: b.orderId,
        refundTrans: [
          {
            orderId: refund.reference,
            amount: 10000,
            resultCode: 0,
            transId: 123,
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetcher);
    expect(
      (
        await executeRefund({ ...refund, provider: "momo" }, payment, session, {
          submit: true,
        })
      ).state,
    ).toBe("succeeded");
    expect(
      (await executeRefund({ ...refund, provider: "momo" }, payment, session))
        .state,
    ).toBe("succeeded");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("ZaloPay acknowledgement stays processing until query confirms settlement", async () => {
    const fetcher = vi.fn(async (url, options) => {
      const b = JSON.parse(options.body);
      expect(b.m_refund_id).toBe(refund.reference);
      if (url.endsWith("/refund"))
        return ok({ return_code: 1, refund_id: 123 });
      expect(b.mac).toBe(
        createHmac("sha256", "test-key")
          .update(`123|merchant-reference|${b.timestamp}`)
          .digest("hex"),
      );
      return ok({ return_code: 1 });
    });
    vi.stubGlobal("fetch", fetcher);
    expect(
      (
        await executeRefund(
          { ...refund, provider: "zalopay" },
          payment,
          session,
          { submit: true },
        )
      ).state,
    ).toBe("processing");
    expect(
      (
        await executeRefund(
          { ...refund, provider: "zalopay" },
          payment,
          session,
        )
      ).state,
    ).toBe("succeeded");
  });
  it("PayPal pending is not success and capture, reference, amount/currency must match", async () => {
    const r = {
      ...refund,
      provider: "paypal",
      providerAmount: "2.00",
      currency: "USD",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) =>
        url.endsWith("/token")
          ? ok({ access_token: "test-token" })
          : ok({
              id: "paypal-refund",
              status: "PENDING",
              custom_id: refund.reference,
              amount: { currency_code: "USD", value: "2.00" },
              links: [
                {
                  rel: "up",
                  href: `https://api-m.sandbox.paypal.com/v2/payments/captures/${payment.transactionId}`,
                },
              ],
            }),
      ),
    );
    expect(
      (await executeRefund(r, payment, session, { submit: true })).state,
    ).toBe("processing");
    expect((await executeRefund(r, payment, session)).code).toBe(
      "paypal_refund_id_required_after_timeout",
    );
  });
  it("PayPal webhook verification uses the configured webhook ID and rejects verification failure", async () => {
    const calls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, options) => {
        calls.push({ url, body: options.body });
        return url.endsWith("/token")
          ? ok({ access_token: "fixture-token" })
          : ok({ verification_status: "FAILURE" });
      }),
    );
    expect(
      await verifyPaypalWebhook(
        new Headers({
          "paypal-transmission-id": "fixture-transmission",
          "paypal-transmission-sig": "fixture-signature",
        }),
        { id: "evt_fixture" },
      ),
    ).toBe(false);
    const payload = JSON.parse(calls.at(-1).body);
    expect(payload.webhook_id).toBe("fixture-webhook");
    expect(payload.transmission_id).toBe("fixture-transmission");
    expect(payload.webhook_event.id).toBe("evt_fixture");
  });
  it("HTTP/network failure never fabricates success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("timeout");
      }),
    );
    await expect(
      executeRefund({ ...refund, provider: "momo" }, payment, session, {
        submit: true,
      }),
    ).rejects.toThrow("timeout");
  });
});
