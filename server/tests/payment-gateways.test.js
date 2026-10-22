import { beforeEach, describe, expect, it, vi } from 'vitest'
import crypto from 'node:crypto'
const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  stripeCreate: vi.fn(),
  stripeRetrieve: vi.fn(),
  stripeExpire: vi.fn(),
  paypalCreate: vi.fn(),
  paypalGet: vi.fn(),
  paypalCapture: vi.fn(),
}))
vi.mock('axios', () => ({ default: { create: () => ({ post: mocks.post }) } }))
vi.mock('stripe', () => ({
  default: class {
    checkout = {
      sessions: {
        create: mocks.stripeCreate,
        retrieve: mocks.stripeRetrieve,
        expire: mocks.stripeExpire,
      },
    }
  },
}))
vi.mock('@paypal/paypal-server-sdk', () => ({
  Client: class {},
  Environment: { Production: 'production', Sandbox: 'sandbox' },
  OrdersController: class {
    createOrder = mocks.paypalCreate
    getOrder = mocks.paypalGet
    captureOrder = mocks.paypalCapture
  },
  CheckoutPaymentIntent: { Capture: 'CAPTURE' },
  PaypalExperienceUserAction: { PayNow: 'PAY_NOW' },
  PaypalWalletContextShippingPreference: { NoShipping: 'NO_SHIPPING' },
}))
vi.mock('../src/lib/utils/environment.js', () => ({
  clientUrl: 'http://localhost:5173',
  serverUrl: 'http://localhost:5172',
  stripeSecretKey: 'sk_test_fixture',
  paypalEnabled: true,
  paypalClientId: 'id',
  paypalClientSecret: 'test-secret',
  paypalVndPerUsd: '25000',
  paypalEnvironment: 'sandbox',
  momoIpnUrl: undefined,
  zalopayCallbackUrl: undefined,
  momoEnabled: true,
  momoPartnerCode: 'PARTNER',
  momoAccessKey: 'access',
  momoSecretKey: 'momo-test-secret',
  momoEndpoint: 'https://test-payment.momo.vn/v2/gateway/api',
  zalopayEnabled: true,
  zalopayEndpoint: 'https://sb-openapi.zalopay.vn/v2/create',
  zalopayGatewayEndpoint: 'https://sb-openapi.zalopay.vn/v2/query',
  zalopayAppId: '1234',
  zalopayKey1: 'zalo-test-key1',
  zalopayKey2: 'zalo-test-key2',
}))
import {
  createGatewayPayment,
  gatewayRequestId,
  paymentMethods,
  queryGatewayPayment,
  safePaymentUrl,
  settlementAmount,
  verifyMomoCallback,
  verifyZaloCallback,
} from '../src/services/payment-gateways.js'
const session = {
  id: '00000000-0000-4000-8000-000000000001',
  userId: 'buyer-id',
  providerAmount: '50000.00',
  currency: 'VND',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 3600000),
}
const order = { id: '00000000-0000-4000-8000-000000000002', code: 'TEST' }
beforeEach(() => vi.resetAllMocks())
describe('payment gateway adapters', () => {
  it('preserves six providers but disables and hides VNPAY', () => {
    expect(paymentMethods()).toHaveLength(6)
    expect(paymentMethods().find((item) => item.id === 'vnpay')).toMatchObject({
      enabled: false,
      hidden: true,
    })
  })
  it('converts PayPal VND with the explicitly configured rate', () => {
    expect(settlementAmount('paypal', 50000)).toEqual({
      amount: '2.00',
      currency: 'USD',
      exchangeRate: '25000',
    })
  })
  it('rejects off-domain, HTTP and deceptive redirect URLs', () => {
    for (const url of [
      'http://checkout.stripe.com/pay',
      'https://checkout.stripe.com.attacker.test/pay',
      'javascript:alert(1)',
    ])
      expect(() => safePaymentUrl('stripe', url)).toThrow()
    expect(
      safePaymentUrl('stripe', 'https://checkout.stripe.com/c/pay/test'),
    ).toContain('https://checkout.stripe.com/')
  })
  it('creates a Stripe-hosted web checkout with server amount and stable idempotency key', async () => {
    mocks.stripeCreate.mockResolvedValue({
      id: 'cs_test',
      url: 'https://checkout.stripe.com/c/pay/test',
    })
    await createGatewayPayment({ ...session, provider: 'stripe' }, order)
    const [body, options] = mocks.stripeCreate.mock.calls[0]
    expect(body.line_items[0].price_data).toMatchObject({
      currency: 'vnd',
      unit_amount: 50000,
    })
    expect(options.idempotencyKey).toBe(session.id)
    expect(body.success_url).toBe(
      `http://localhost:5173/purchase?orderId=${order.id}`,
    )
  })
  it('uses the actual order amount and unique merchant ID for MoMo', async () => {
    mocks.post.mockResolvedValue({
      data: { resultCode: 0, payUrl: 'https://test-payment.momo.vn/pay' },
    })
    const result = await createGatewayPayment(
      { ...session, provider: 'momo' },
      order,
    )
    expect(mocks.post.mock.calls[0][1]).toMatchObject({
      amount: 50000,
      orderId: session.id,
    })
    expect(result.providerId).toBe(session.id)
  })
  it('uses ZaloPay Vietnam date prefix, real amount and local callback URL', async () => {
    mocks.post.mockResolvedValue({
      data: { return_code: 1, order_url: 'https://sb-openapi.zalopay.vn/pay' },
    })
    const zalo = {
      ...session,
      provider: 'zalopay',
      createdAt: new Date('2026-10-18T18:00:00Z'),
    }
    expect(gatewayRequestId(zalo)).toMatch(/^261019_/)
    await createGatewayPayment(zalo, order)
    const body = mocks.post.mock.calls[0][1]
    expect(body.get('amount')).toBe('50000')
    expect(body.get('callback_url')).toBe(
      'http://localhost:5172/wallet/zalopay/callback',
    )
  })
  it('never treats a Stripe redirect or unpaid session as a successful payment', async () => {
    mocks.stripeRetrieve.mockResolvedValue({
      id: 'cs_test',
      status: 'open',
      payment_status: 'unpaid',
      amount_total: 50000,
      currency: 'vnd',
    })
    expect(
      (
        await queryGatewayPayment({
          ...session,
          provider: 'stripe',
          providerOrderId: 'cs_test',
        })
      ).state,
    ).toBe('pending')
  })
  it('requires a completed capture, not just approval, for PayPal paid status', async () => {
    mocks.paypalGet.mockResolvedValue({
      result: {
        id: 'paypal-order',
        status: 'APPROVED',
        purchaseUnits: [{ amount: { currencyCode: 'USD', value: '2.00' } }],
      },
    })
    expect(
      (
        await queryGatewayPayment({
          ...session,
          provider: 'paypal',
          providerOrderId: 'paypal-order',
        })
      ).state,
    ).toBe('pending')
    expect(mocks.paypalCapture).not.toHaveBeenCalled()
  })
  it('verifies callback signatures and rejects tampered payloads', () => {
    const data = JSON.stringify({ app_trans_id: 'test', amount: 50000 })
    const mac = crypto
      .createHmac('sha256', 'zalo-test-key2')
      .update(data)
      .digest('hex')
    expect(verifyZaloCallback({ data, mac })).toBe(true)
    expect(verifyZaloCallback({ data: `${data} `, mac })).toBe(false)
    expect(
      verifyMomoCallback({ partnerCode: 'PARTNER', signature: 'invalid' }),
    ).toBe(false)
  })
})
