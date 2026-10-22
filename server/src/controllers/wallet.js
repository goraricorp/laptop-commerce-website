import { fromNodeHeaders } from "better-auth/node";
import { createHash } from "node:crypto";
import { receiveWebhook } from "../services/jobs.js";
import { z } from "zod";
import { initiatePayment, refreshPayment } from "../services/checkout.js";
import {
  getStripe,
  verifyMomoCallback,
  verifyZaloCallback,
} from "../services/payment-gateways.js";
import { stripeWebhookSecret } from "../lib/utils/environment.js";
import { checkoutError } from "../lib/checkout/contracts.js";
function paymentController(provider) {
  return async (req, res) => {
    const { orderId } = z
      .object({
        orderId: z.uuid(),
      })
      .strict()
      .parse(req["body"]);
    return res
      .status(200)
      .json(await initiatePayment(req["user"].id, orderId, provider));
  };
}
export const stripePayment = paymentController("stripe");
export const stripeSelection = stripePayment;
export const momoPayment = paymentController("momo");
export const zalopayPayment = paymentController("zalopay");
export const paypalCreateOrder = paymentController("paypal");
export const vnpayPayment = paymentController("vnpay");
export async function paypalCaptureOrder(req, res) {
  const { orderId } = z
    .object({
      orderId: z.uuid(),
    })
    .strict()
    .parse(req["body"]);
  return res.status(200).json(
    await refreshPayment(req["user"].id, orderId, {
      capture: true,
    }),
  );
}
export async function momoCallback(req, res) {
  if (!verifyMomoCallback(req["body"]))
    throw checkoutError(400, "Chữ ký MoMo không hợp lệ.");
  await receiveWebhook(
    "momo",
    createHash("sha256").update(req["body"].signature).digest("hex"),
    req["body"].orderId,
  );
  return res.status(204).end();
}
export async function zalopayCallback(req, res) {
  if (!verifyZaloCallback(req["body"]))
    return res.status(200).json({
      return_code: -1,
      return_message: "Invalid signature",
    });
  try {
    const data = JSON.parse(req["body"].data);
    await receiveWebhook(
      "zalopay",
      createHash("sha256").update(req["body"].mac).digest("hex"),
      data.app_trans_id,
    );
    return res.status(200).json({
      return_code: 1,
      return_message: "success",
    });
  } catch {
    return res.status(200).json({
      return_code: 0,
      return_message: "Retry verification",
    });
  }
}
export async function stripeWebhook(req, res) {
  if (!stripeWebhookSecret)
    throw checkoutError(503, "Chưa cấu hình STRIPE_WEBHOOK_SECRET.");
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      await req.body,
      req.get("stripe-signature"),
      stripeWebhookSecret,
    );
  } catch {
    throw checkoutError(400, "Chữ ký Stripe không hợp lệ.");
  }
  if (
    [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.expired",
      "checkout.session.async_payment_failed",
    ].includes(event.type)
  )
    await receiveWebhook("stripe", event.id, event.data.object.id);
  if (
    ["refund.created", "refund.updated", "refund.failed"].includes(event.type)
  )
    await receiveWebhook(
      "stripe",
      event.id,
      event.data.object.id,
      "refund",
      event.data.object.metadata?.refund_reference ?? null,
    );
  return res.status(200).json({
    received: true,
  });
}
export async function paypalWebhook(req, res) {
  const { verifyPaypalWebhook } =
    await import("../services/refund-gateways.js");
  const event = req["body"];
  if (!(await verifyPaypalWebhook(fromNodeHeaders(req.headers), event)))
    throw checkoutError(400, "Chữ ký PayPal không hợp lệ.");
  if (typeof event.id !== "string" || typeof event.event_type !== "string")
    throw checkoutError(400, "Webhook không hợp lệ.");
  if (
    [
      "PAYMENT.CAPTURE.REFUNDED",
      "PAYMENT.REFUND.PENDING",
      "PAYMENT.REFUND.COMPLETED",
      "PAYMENT.REFUND.FAILED",
    ].includes(event.event_type) &&
    event.resource?.id
  )
    await receiveWebhook(
      "paypal",
      event.id,
      event.resource.id,
      "refund",
      event.resource.custom_id ?? null,
    );
  else if (
    ["PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.DENIED"].includes(
      event.event_type,
    ) &&
    event.resource?.supplementary_data?.related_ids?.order_id
  )
    await receiveWebhook(
      "paypal",
      event.id,
      event.resource.supplementary_data.related_ids.order_id,
    );
  return res.status(200).json({
    received: true,
  });
}
