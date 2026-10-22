import { createHmac } from "node:crypto";
import { Buffer } from "node:buffer";
import { getStripe } from "./payment-gateways.js";
import * as env from "../lib/utils/environment.js";
const mac = (key, value) =>
  createHmac("sha256", key).update(value).digest("hex");
async function request(url, body, headers = {}) {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(35000),
  });
  if (!response.ok) throw new Error("provider_unavailable");
  return response.json();
}
const pending = (code = "awaiting_provider") => ({ state: "processing", code });
const review = (code = "provider_response_mismatch") => ({
  state: "needs_review",
  code,
});
function verified(
  refund,
  state,
  id,
  amount = refund.providerAmount,
  currency = refund.currency,
) {
  return {
    state,
    id,
    amount,
    currency,
    reference: refund.reference,
    verified: true,
  };
}
async function paypalToken() {
  if (!env.paypalApiUrl || !env.paypalClientId || !env.paypalClientSecret)
    throw new Error("provider_not_configured");
  const result = await fetch(`${env.paypalApiUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10000),
  });
  if (!result.ok) throw new Error("provider_unavailable");
  return (await result.json()).access_token;
}
// Callers persist submittedAt BEFORE the first request. Every subsequent attempt queries only.
export async function executeRefund(
  refund,
  payment,
  session,
  { submit = false } = {},
) {
  if (!payment.transactionId) return review("missing_original_transaction");
  if (refund.provider === "stripe") {
    const stripe = getStripe();
    let result;
    if (submit)
      result = await stripe.refunds.create(
        {
          payment_intent: payment.transactionId,
          amount: Number(refund.providerAmount),
          metadata: { refund_reference: refund.reference },
        },
        { idempotencyKey: refund.reference },
      );
    else if (refund.providerRefundId)
      result = await stripe.refunds.retrieve(refund.providerRefundId);
    else {
      const matches = (
        await stripe.refunds.list({
          payment_intent: payment.transactionId,
          limit: 100,
        })
      ).data.filter((r) => r.metadata?.refund_reference === refund.reference);
      if (matches.length !== 1) return review("refund_reference_not_resolved");
      result = matches[0];
    }
    if (
      result.payment_intent !== payment.transactionId ||
      result.metadata?.refund_reference !== refund.reference ||
      Number(result.amount) !== Number(refund.providerAmount) ||
      result.currency?.toUpperCase() !== refund.currency
    )
      return review();
    return verified(
      refund,
      result.status === "succeeded"
        ? "succeeded"
        : ["failed", "canceled"].includes(result.status)
          ? "failed"
          : "processing",
      result.id,
      result.amount,
      result.currency.toUpperCase(),
    );
  }
  if (refund.provider === "paypal") {
    if (!submit && !refund.providerRefundId)
      return review("paypal_refund_id_required_after_timeout");
    const headers = {
      Authorization: `Bearer ${await paypalToken()}`,
      "PayPal-Request-Id": refund.reference,
      Prefer: "return=representation",
    };
    const result = submit
      ? await request(
          `${env.paypalApiUrl}/v2/payments/captures/${encodeURIComponent(payment.transactionId)}/refund`,
          {
            amount: {
              currency_code: refund.currency,
              value: Number(refund.providerAmount).toFixed(2),
            },
            custom_id: refund.reference,
          },
          headers,
        )
      : await request(
          `${env.paypalApiUrl}/v2/payments/refunds/${encodeURIComponent(refund.providerRefundId)}`,
          undefined,
          headers,
        );
    const original = result.links?.some(
      (l) =>
        l.rel === "up" && l.href.endsWith(`/captures/${payment.transactionId}`),
    );
    if (
      !original ||
      result.custom_id !== refund.reference ||
      result.amount?.currency_code !== refund.currency ||
      Number(result.amount?.value) !== Number(refund.providerAmount)
    )
      return review();
    return verified(
      refund,
      result.status === "COMPLETED"
        ? "succeeded"
        : ["FAILED", "CANCELLED"].includes(result.status)
          ? "failed"
          : "processing",
      result.id,
      result.amount.value,
      result.amount.currency_code,
    );
  }
  if (refund.provider === "momo") {
    if (
      !env.momoEndpoint ||
      !env.momoSecretKey ||
      !env.momoAccessKey ||
      !env.momoPartnerCode
    )
      return review("provider_not_configured");
    const root = env.momoEndpoint.replace(/\/$/, "");
    if (submit) {
      const body = {
        partnerCode: env.momoPartnerCode,
        orderId: refund.reference,
        requestId: refund.reference,
        amount: Number(refund.providerAmount),
        transId: payment.transactionId,
        description: `Refund ${refund.reference}`,
        lang: "vi",
      };
      body.signature = mac(
        env.momoSecretKey,
        `accessKey=${env.momoAccessKey}&amount=${body.amount}&description=${body.description}&orderId=${body.orderId}&partnerCode=${body.partnerCode}&requestId=${body.requestId}&transId=${body.transId}`,
      );
      const result = await request(`${root}/refund`, body);
      if (
        result.partnerCode !== body.partnerCode ||
        result.orderId !== body.orderId ||
        result.requestId !== body.requestId ||
        Number(result.amount) !== body.amount
      )
        return review();
      if (result.resultCode === 0)
        return verified(
          refund,
          "succeeded",
          String(result.transId),
          result.amount,
          "VND",
        );
      // Duplicate, timeout and business errors must be reconciled, not release the refund budget.
      return pending(`momo_${Number(result.resultCode)}`);
    }
    const body = {
      partnerCode: env.momoPartnerCode,
      orderId: session.providerOrderId,
      requestId: refund.reference,
      lang: "vi",
    };
    body.signature = mac(
      env.momoSecretKey,
      `accessKey=${env.momoAccessKey}&orderId=${body.orderId}&partnerCode=${body.partnerCode}&requestId=${body.requestId}`,
    );
    const result = await request(`${root}/refund/query`, body);
    if (
      result.orderId !== session.providerOrderId ||
      result.partnerCode !== env.momoPartnerCode
    )
      return review();
    const entry = result.refundTrans?.find(
      (r) => r.orderId === refund.reference,
    );
    if (!entry || Number(entry.amount) !== Number(refund.providerAmount))
      return review("refund_reference_not_resolved");
    return entry.resultCode === 0
      ? verified(
          refund,
          "succeeded",
          String(entry.transId),
          entry.amount,
          "VND",
        )
      : pending(`momo_${Number(entry.resultCode)}`);
  }
  if (refund.provider === "zalopay") {
    if (!env.zalopayEndpoint || !env.zalopayKey1 || !env.zalopayAppId)
      return review("provider_not_configured");
    const root = new URL(env.zalopayEndpoint),
      timestamp = Date.now();
    root.pathname = submit ? "/v2/refund" : "/v2/query_refund";
    root.search = "";
    const body = {
      app_id: Number(env.zalopayAppId),
      m_refund_id: refund.reference,
      timestamp,
    };
    if (submit) {
      Object.assign(body, {
        zp_trans_id: payment.transactionId,
        amount: Number(refund.providerAmount),
        description: `Refund ${refund.id}`,
      });
      body.mac = mac(
        env.zalopayKey1,
        `${body.app_id}|${body.zp_trans_id}|${body.amount}|${body.description}|${timestamp}`,
      );
    } else
      body.mac = mac(
        env.zalopayKey1,
        `${body.app_id}|${body.m_refund_id}|${timestamp}`,
      );
    const result = await request(root.href, body);
    // A submission acknowledgement is NOT settlement. Query the durable merchant reference.
    if (submit)
      return {
        ...pending(),
        id: result.refund_id ? String(result.refund_id) : undefined,
      };
    return result.return_code === 1
      ? verified(
          refund,
          "succeeded",
          refund.providerRefundId ?? refund.reference,
        )
      : pending(`zalopay_${Number(result.return_code)}`);
  }
  return review("unsupported_provider");
}

export async function verifyPaypalWebhook(headers, event) {
  if (!env.paypalWebhookId)
    throw Object.assign(new Error("Chưa cấu hình PAYPAL_WEBHOOK_ID."), {
      status: 503,
    });
  const result = await request(
    `${env.paypalApiUrl}/v1/notifications/verify-webhook-signature`,
    {
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: env.paypalWebhookId,
      webhook_event: event,
    },
    { Authorization: `Bearer ${await paypalToken()}` },
  );
  return result.verification_status === "SUCCESS";
}
