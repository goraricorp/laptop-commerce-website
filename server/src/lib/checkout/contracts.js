import { createHash } from 'node:crypto'
import { z } from 'zod'

export const providers = ['cod', 'momo', 'zalopay', 'vnpay', 'paypal', 'stripe']
export const checkoutInput = z
  .object({
    items: z
      .array(
        z
          .object({
            variantId: z.uuid(),
            quantity: z.number().int().min(1).max(99),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    addressId: z.uuid(),
    shipping: z.enum(['standard', 'express']).default('standard'),
    provider: z.enum(providers),
    voucherCode: z.string().trim().max(64).default(''),
    note: z.string().trim().max(1000).default(''),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      new Set(value.items.map((item) => item.variantId)).size !==
      value.items.length
    )
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'Sản phẩm bị trùng trong giỏ hàng.',
      })
  })
export const placeInput = z
  .object({
    requestKey: z.uuid(),
    quoteToken: z.string().regex(/^[a-f0-9]{64}$/),
    checkout: checkoutInput,
  })
  .strict()
export const shippingPrices = { standard: 0, express: 35000 }
export const checkoutError = (status, message) =>
  Object.assign(new Error(message), { status })
export function fingerprint(input) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        ...input,
        items: [...input.items].sort((a, b) =>
          a.variantId.localeCompare(b.variantId),
        ),
      }),
    )
    .digest('hex')
}
export function vndAmount(value) {
  const amount = Number(value)
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw checkoutError(409, 'Sản phẩm chưa có giá bán hợp lệ.')
  return amount
}
export function assertSettlement(session, result) {
  if (result.state !== 'paid') return
  if (
    !result.transactionId ||
    result.transactionId === '0' ||
    String(result.providerId) !== session.providerOrderId ||
    result.currency !== session.currency ||
    Number(result.amount) !== Number(session.providerAmount)
  )
    throw checkoutError(
      409,
      'Giao dịch không khớp mã đơn, số tiền hoặc loại tiền.',
    )
}
