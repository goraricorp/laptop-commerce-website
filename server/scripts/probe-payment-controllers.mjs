import process from 'node:process'
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local', quiet: true })
if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || process.env.PAYPAL_ENVIRONMENT !== 'sandbox' || !process.env.MOMO_ENDPOINT?.startsWith('https://test-payment.momo.vn/') || !process.env.ZALOPAY_MERCHANT_ENDPOINT?.startsWith('https://sb-openapi.zalopay.vn/')) throw new Error('Probe requires sandbox configuration for all four gateways')
const { createGatewayPayment, queryGatewayPayment, settlementAmount } = await import('../src/services/payment-gateways.js')
const results = await Promise.all(['momo', 'zalopay', 'paypal', 'stripe'].map(async provider => {
  const converted = settlementAmount(provider, 50000)
  const session = { id: randomUUID(), userId: randomUUID(), provider, providerAmount: converted.amount, currency: converted.currency, createdAt: new Date(), expiresAt: new Date(Date.now() + 3600000) }
  try {
    const result = await createGatewayPayment(session, { id: randomUUID(), code: 'SANDBOX-PROBE' })
    let state
    try { state = (await queryGatewayPayment({ ...session, providerOrderId: result.providerId })).state } catch { state = 'query-unavailable' }
    return { provider, success: true, responseKeys: Object.keys(result), redirectHost: new URL(result.url).hostname, currency: session.currency, amount: session.providerAmount, unpaidState: state }
  } catch (error) { return { provider, success: false, status: error.status ?? 500, message: error.message } }
}))
await fs.writeFile('docs/payment-gateway-probe.json', JSON.stringify(results, null, 2)+'\n')
process.stdout.write(JSON.stringify(results, null, 2)+'\n')
if (results.some(item => !item.success)) process.exitCode = 1
