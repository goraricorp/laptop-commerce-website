import process from "node:process";
import { Buffer } from "node:buffer";

function serviceError(status, message, details) {
  return Object.assign(new Error(message), { details, status });
}

const baseUrl =
  process.env.PAYPAL_API_URL ?? "https://api-m.sandbox.paypal.com";

async function accessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    throw serviceError(503, "PayPal is not configured");
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  if (!response.ok)
    throw serviceError(502, "Unable to authenticate with PayPal");
  return data.access_token;
}

async function paypalRequest(path, body) {
  const token = await accessToken();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw serviceError(
      response.status,
      data.message ?? "PayPal request failed",
      data.details,
    );
  return data;
}

export async function createPaymentOrder(totalPrice, currency) {
  return await paypalRequest("/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [
      { amount: { currency_code: currency, value: totalPrice.toFixed(2) } },
    ],
  });
}

export async function capturePaymentOrder(orderId) {
  return await paypalRequest(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {},
  );
}
