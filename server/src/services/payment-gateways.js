import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import axios from 'axios'
import Stripe from 'stripe'
import {
  Client,
  Environment,
  OrdersController,
  CheckoutPaymentIntent,
  PaypalExperienceUserAction,
  PaypalWalletContextShippingPreference,
} from '@paypal/paypal-server-sdk'
import * as env from '../lib/utils/environment.js'
import { checkoutError } from '../lib/checkout/contracts.js'

const http = axios.create({ timeout: 35000 })
const mac = (secret, data) =>
  crypto.createHmac('sha256', secret).update(data).digest('hex')
export function equalSignature(actual, expected) {
  return (
    typeof actual === 'string' &&
    /^[a-f0-9]+$/i.test(actual) &&
    actual.length === expected.length &&
    crypto.timingSafeEqual(
      Buffer.from(actual.toLowerCase()),
      Buffer.from(expected.toLowerCase()),
    )
  )
}
export const getStripe = () => {
  if (!env.stripeSecretKey)
    throw checkoutError(503, 'Stripe chưa được cấu hình.')
  return new Stripe(env.stripeSecretKey, {
    timeout: 15000,
    maxNetworkRetries: 0,
  })
}
function paypal() {
  return new OrdersController(
    new Client({
      environment:
        env.paypalEnvironment === 'production'
          ? Environment.Production
          : Environment.Sandbox,
      clientCredentialsAuthCredentials: {
        oAuthClientId: env.paypalClientId,
        oAuthClientSecret: env.paypalClientSecret,
      },
      timeout: 15000,
    }),
  )
}
function returnUrl(id, cancelled = false) {
  const url = new URL('/purchase', env.clientUrl)
  url.searchParams.set('orderId', id)
  if (cancelled) url.searchParams.set('cancelled', '1')
  return url.href
}
export function paymentMethods() {
  const values = [
    ['cod', 'Thanh toán khi nhận hàng', true],
    [
      'momo',
      'MoMo',
      env.momoEnabled &&
        env.momoEndpoint &&
        env.momoPartnerCode &&
        env.momoAccessKey &&
        env.momoSecretKey,
    ],
    [
      'zalopay',
      'ZaloPay',
      env.zalopayEnabled &&
        env.zalopayEndpoint &&
        env.zalopayGatewayEndpoint &&
        env.zalopayAppId &&
        env.zalopayKey1 &&
        env.zalopayKey2,
    ],
    ['vnpay', 'VNPAY', false],
    [
      'paypal',
      'PayPal',
      env.paypalEnabled &&
        env.paypalClientId &&
        env.paypalClientSecret &&
        Number(env.paypalVndPerUsd) > 0,
    ],
    ['stripe', 'Stripe', env.stripeSecretKey],
  ]
  return values.map(([id, label, enabled]) => ({
    id,
    label,
    enabled: Boolean(enabled),
    hidden: id === 'vnpay',
  }))
}
export function assertGateway(provider) {
  if (!paymentMethods().find((item) => item.id === provider)?.enabled)
    throw checkoutError(
      503,
      provider === 'vnpay'
        ? 'VNPAY đang tạm ngừng.'
        : 'Phương thức thanh toán chưa được cấu hình đầy đủ.',
    )
}
export function settlementAmount(provider, vnd) {
  if (provider !== 'paypal')
    return { amount: vnd.toFixed(2), currency: 'VND', exchangeRate: null }
  const rate = Number(env.paypalVndPerUsd)
  if (!Number.isFinite(rate) || rate <= 0)
    throw checkoutError(503, 'Chưa cấu hình tỷ giá PayPal.')
  const amount = (Math.round((vnd / rate) * 100) / 100).toFixed(2)
  if (Number(amount) <= 0)
    throw checkoutError(400, 'Số tiền quá nhỏ để thanh toán PayPal.')
  return { amount, currency: 'USD', exchangeRate: String(rate) }
}
export function gatewayRequestId(session) {
  if (session.provider !== 'zalopay') return session.id
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(session.createdAt))
  const field = (type) => date.find((part) => part.type === type).value
  return `${field('year')}${field('month')}${field('day')}_${session.id.replaceAll('-', '').slice(0, 24)}`
}
export function safePaymentUrl(provider, value) {
  const allowed = {
    stripe: ['checkout.stripe.com'],
    paypal: [
      'www.paypal.com',
      'www.sandbox.paypal.com',
      'paypal.com',
      'sandbox.paypal.com',
    ],
    momo: ['payment.momo.vn', 'test-payment.momo.vn'],
    zalopay: ['zalopay.vn', 'zalopay.com.vn'],
  }
  let url
  try {
    url = new URL(value)
  } catch {
    throw checkoutError(502, 'Cổng thanh toán không trả về URL hợp lệ.')
  }
  if (
    url.protocol !== 'https:' ||
    !allowed[provider]?.some(
      (domain) =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`),
    )
  )
    throw checkoutError(502, 'URL thanh toán không thuộc nhà cung cấp.')
  return url.href
}

export async function createGatewayPayment(session, order) {
  assertGateway(session.provider)
  const amount = Number(session.providerAmount)
  const merchantId = gatewayRequestId(session)
  try {
    if (session.provider === 'stripe') {
      const result = await getStripe().checkout.sessions.create(
        {
          mode: 'payment',
          client_reference_id: order.id,
          metadata: { orderId: order.id, checkoutId: session.id },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'vnd',
                unit_amount: amount,
                product_data: { name: `Đơn hàng ${order.code}` },
              },
            },
          ],
          success_url: returnUrl(order.id),
          cancel_url: returnUrl(order.id, true),
          expires_at: Math.floor(new Date(session.expiresAt).getTime() / 1000),
        },
        { idempotencyKey: session.id },
      )
      return {
        providerId: result.id,
        url: safePaymentUrl('stripe', result.url),
      }
    }
    if (session.provider === 'paypal') {
      const response = await paypal().createOrder({
        paypalRequestId: session.id,
        prefer: 'return=representation',
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              referenceId: order.id,
              customId: session.id,
              amount: { currencyCode: 'USD', value: session.providerAmount },
              description: `Đơn hàng ${order.code}`,
            },
          ],
          paymentSource: {
            paypal: {
              experienceContext: {
                returnUrl: returnUrl(order.id),
                cancelUrl: returnUrl(order.id, true),
                userAction: PaypalExperienceUserAction.PayNow,
                shippingPreference:
                  PaypalWalletContextShippingPreference.NoShipping,
              },
            },
          },
        },
      })
      const result = response.result
      return {
        providerId: result.id,
        url: safePaymentUrl(
          'paypal',
          result.links?.find((link) =>
            ['approve', 'payer-action'].includes(link.rel),
          )?.href,
        ),
      }
    }
    if (session.provider === 'momo') {
      const redirectUrl = returnUrl(order.id)
      const ipnUrl =
        env.momoIpnUrl || new URL('/wallet/momo/callback', env.serverUrl).href
      const body = {
        partnerCode: env.momoPartnerCode,
        requestId: merchantId,
        orderId: merchantId,
        amount,
        orderInfo: `Thanh toán ${order.code}`,
        redirectUrl,
        ipnUrl,
        requestType: 'payWithMethod',
        extraData: '',
        lang: 'vi',
        autoCapture: true,
      }
      body.signature = mac(
        env.momoSecretKey,
        `accessKey=${env.momoAccessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${merchantId}&orderInfo=${body.orderInfo}&partnerCode=${env.momoPartnerCode}&redirectUrl=${redirectUrl}&requestId=${merchantId}&requestType=payWithMethod`,
      )
      const { data } = await http.post(
        `${env.momoEndpoint.replace(/\/$/, '')}/create`,
        body,
      )
      if (data.resultCode !== 0)
        throw checkoutError(502, 'MoMo từ chối tạo phiên thanh toán.')
      return {
        providerId: merchantId,
        url: safePaymentUrl('momo', data.payUrl),
      }
    }
    if (session.provider === 'zalopay') {
      const body = {
        app_id: Number(env.zalopayAppId),
        app_trans_id: merchantId,
        app_user: session.userId,
        app_time: Date.now(),
        amount,
        item: '[]',
        embed_data: JSON.stringify({ redirecturl: returnUrl(order.id) }),
        description: `Thanh toán ${order.code}`,
        bank_code: '',
        callback_url:
          env.zalopayCallbackUrl ||
          new URL('/wallet/zalopay/callback', env.serverUrl).href,
      }
      body.mac = mac(
        env.zalopayKey1,
        `${body.app_id}|${merchantId}|${body.app_user}|${amount}|${body.app_time}|${body.embed_data}|${body.item}`,
      )
      const { data } = await http.post(
        env.zalopayEndpoint,
        new URLSearchParams(
          Object.entries(body).map(([key, value]) => [key, String(value)]),
        ),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      )
      if (data.return_code !== 1)
        throw checkoutError(502, 'ZaloPay từ chối tạo phiên thanh toán.')
      return {
        providerId: merchantId,
        url: safePaymentUrl('zalopay', data.order_url),
      }
    }
    throw checkoutError(503, 'Phương thức thanh toán không khả dụng.')
  } catch (error) {
    if (error.status && !error.response) throw error
    throw checkoutError(
      502,
      'Không thể kết nối cổng thanh toán. Vui lòng kiểm tra trạng thái đơn trước khi thử lại.',
    )
  }
}

export async function queryGatewayPayment(
  session,
  { capture = false, expire = false } = {},
) {
  try {
    if (session.provider === 'stripe') {
      let result = await getStripe().checkout.sessions.retrieve(
        session.providerOrderId,
      )
      if (expire && result.status === 'open')
        result = await getStripe().checkout.sessions.expire(
          session.providerOrderId,
        )
      return {
        state:
          result.payment_status === 'paid'
            ? 'paid'
            : result.status === 'expired'
              ? 'failed'
              : 'pending',
        amount: result.amount_total,
        currency: result.currency?.toUpperCase(),
        providerId: result.id,
        transactionId:
          typeof result.payment_intent === 'string'
            ? result.payment_intent
            : result.payment_intent?.id,
      }
    }
    if (session.provider === 'paypal') {
      let result = (await paypal().getOrder({ id: session.providerOrderId }))
        .result
      if (
        capture &&
        result.status === 'APPROVED' &&
        new Date(session.expiresAt) > new Date()
      )
        result = (
          await paypal().captureOrder({
            id: session.providerOrderId,
            paypalRequestId: `${session.id}-capture`,
            prefer: 'return=representation',
          })
        ).result
      const captures =
        result.purchaseUnits?.flatMap(
          (unit) => unit.payments?.captures ?? [],
        ) ?? []
      const unit = result.purchaseUnits?.[0]
      const paid =
        result.status === 'COMPLETED' &&
        captures.length === 1 &&
        captures[0].status === 'COMPLETED'
      return {
        state: paid
          ? 'paid'
          : result.status === 'VOIDED' ||
              (expire &&
                [
                  'CREATED',
                  'SAVED',
                  'PAYER_ACTION_REQUIRED',
                  'APPROVED',
                ].includes(result.status))
            ? 'failed'
            : 'pending',
        amount: captures[0]?.amount?.value ?? unit?.amount?.value,
        currency:
          captures[0]?.amount?.currencyCode ?? unit?.amount?.currencyCode,
        providerId: result.id,
        transactionId: captures[0]?.id,
      }
    }
    if (session.provider === 'momo') {
      const orderId = session.providerOrderId
      const requestId = crypto.randomUUID()
      const body = {
        partnerCode: env.momoPartnerCode,
        orderId,
        requestId,
        lang: 'vi',
        signature: mac(
          env.momoSecretKey,
          `accessKey=${env.momoAccessKey}&orderId=${orderId}&partnerCode=${env.momoPartnerCode}&requestId=${requestId}`,
        ),
      }
      const { data } = await http.post(
        `${env.momoEndpoint.replace(/\/$/, '')}/query`,
        body,
      )
      return {
        state:
          data.resultCode === 0
            ? 'paid'
            : [1003, 1005, 1006, 1007, 1017].includes(data.resultCode)
              ? 'failed'
              : 'pending',
        amount: data.amount,
        currency: 'VND',
        providerId: data.orderId,
        transactionId: String(data.transId ?? ''),
      }
    }
    if (session.provider === 'zalopay') {
      const body = {
        app_id: Number(env.zalopayAppId),
        app_trans_id: session.providerOrderId,
      }
      body.mac = mac(
        env.zalopayKey1,
        `${body.app_id}|${body.app_trans_id}|${env.zalopayKey1}`,
      )
      const { data } = await http.post(
        env.zalopayGatewayEndpoint,
        new URLSearchParams(
          Object.entries(body).map(([key, value]) => [key, String(value)]),
        ),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      )
      return {
        state:
          data.return_code === 1
            ? 'paid'
            : data.return_code === 2
              ? 'failed'
              : 'pending',
        amount: data.amount,
        currency: 'VND',
        providerId: session.providerOrderId,
        transactionId: String(data.zp_trans_id ?? ''),
      }
    }
    throw checkoutError(503, 'Không thể đối soát phương thức thanh toán này.')
  } catch (error) {
    if (error.status && !error.response) throw error
    throw checkoutError(
      502,
      'Chưa thể xác minh kết quả với cổng thanh toán. Vui lòng thử lại.',
    )
  }
}

export function verifyMomoCallback(body) {
  if (!env.momoSecretKey || body.partnerCode !== env.momoPartnerCode)
    return false
  const keys = [
    'amount',
    'extraData',
    'message',
    'orderId',
    'orderInfo',
    'orderType',
    'partnerCode',
    'payType',
    'requestId',
    'responseTime',
    'resultCode',
    'transId',
  ]
  return equalSignature(
    body.signature,
    mac(
      env.momoSecretKey,
      `accessKey=${env.momoAccessKey}&${keys.map((key) => `${key}=${body[key] ?? ''}`).join('&')}`,
    ),
  )
}
export function verifyZaloCallback(body) {
  return (
    typeof body.data === 'string' &&
    Boolean(env.zalopayKey2) &&
    equalSignature(body.mac, mac(env.zalopayKey2, body.data))
  )
}
