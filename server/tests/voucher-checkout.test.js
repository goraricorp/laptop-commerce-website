import { beforeEach, describe, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ rows: new Map() }))
vi.mock('../src/database/index.js', () => ({
  db: {
    select: () => {
      let table
      const query = {
        from(value) {
          table = value
          return query
        },
        innerJoin() {
          return query
        },
        where() {
          return query
        },
        orderBy() {
          return query
        },
        then(resolve, reject) {
          return Promise.resolve(state.rows.get(table) ?? []).then(
            resolve,
            reject,
          )
        },
      }
      return query
    },
  },
}))
vi.mock('../src/services/payment-gateways.js', () => ({
  assertGateway: vi.fn(),
  settlementAmount: (_provider, amount) => ({
    amount: String(amount),
    currency: 'VND',
  }),
  createGatewayPayment: vi.fn(),
  gatewayRequestId: vi.fn(),
  queryGatewayPayment: vi.fn(),
}))
import { quoteCheckout } from '../src/services/checkout.js'
import {
  addresses,
  productVariants,
  inventoryBalances,
  promotionCodes,
  promotionUsages,
} from '../src/database/schema.js'
const buyer = '00000000-0000-4000-8000-000000000001'
const address = '00000000-0000-4000-8000-000000000002'
const variant = '00000000-0000-4000-8000-000000000003'
const input = {
  items: [{ variantId: variant, quantity: 2 }],
  addressId: address,
  provider: 'cod',
  voucherCode: 'SAVE',
  shipping: 'express',
}
let voucher
beforeEach(() => {
  state.rows.clear()
  state.rows.set(addresses, [{ id: address }])
  state.rows.set(productVariants, [
    {
      variant: {
        id: variant,
        status: 'active',
        price: '200000',
        sku: 'TEST',
        name: 'Test',
      },
      product: { status: 'active', name: 'Test product' },
    },
  ])
  state.rows.set(inventoryBalances, [
    {
      balance: {
        variantId: variant,
        locationId: address,
        quantityOnHand: 10,
        quantityReserved: 0,
      },
    },
  ])
  voucher = {
    code: {
      id: address,
      code: 'SAVE',
      usageLimit: 10,
      usedCount: 0,
      usagePerUser: 1,
    },
    promotion: {
      id: buyer,
      isActive: true,
      startsAt: new Date(Date.now() - 10000),
      endsAt: new Date(Date.now() + 60000),
      minimumOrderValue: '300000',
      maximumDiscount: '50000',
      discountType: 'percentage',
      discountValue: '20',
    },
  }
  state.rows.set(promotionCodes, [voucher])
})
describe('checkout voucher pricing', () => {
  it('uses DB prices and caps percentage discounts before adding shipping', async () => {
    expect(await quoteCheckout(buyer, input)).toMatchObject({
      subtotal: 400000,
      discount: 50000,
      shipping: 35000,
      grandTotal: 385000,
    })
    voucher.promotion.discountType = 'fixed'
    voucher.promotion.discountValue = '25000'
    expect(await quoteCheckout(buyer, input)).toMatchObject({
      discount: 25000,
      grandTotal: 410000,
    })
  })
  it('binds voucher changes to the quote token', async () => {
    const original = await quoteCheckout(buyer, input)
    voucher.promotion.maximumDiscount = '30000'
    expect((await quoteCheckout(buyer, input)).quoteToken).not.toBe(
      original.quoteToken,
    )
  })
  it('rejects inactive, expired, premature, exhausted and minimum-value violations', async () => {
    for (const change of [
      { isActive: false },
      { endsAt: new Date(0) },
      { startsAt: new Date(Date.now() + 60000) },
      { minimumOrderValue: '500000' },
    ]) {
      const original = { ...voucher.promotion }
      Object.assign(voucher.promotion, change)
      await expect(quoteCheckout(buyer, input)).rejects.toMatchObject({
        status: 409,
      })
      voucher.promotion = original
    }
    voucher.code.usedCount = 10
    await expect(quoteCheckout(buyer, input)).rejects.toMatchObject({
      status: 409,
    })
    voucher.code.usedCount = 0
    state.rows.set(promotionUsages, [{ id: address }])
    await expect(quoteCheckout(buyer, input)).rejects.toMatchObject({
      status: 409,
    })
  })
  it('rejects unknown codes and never accepts client discount values', async () => {
    state.rows.set(promotionCodes, [])
    await expect(quoteCheckout(buyer, input)).rejects.toMatchObject({
      status: 409,
    })
    await expect(
      quoteCheckout(buyer, { ...input, discount: 1 }),
    ).rejects.toThrow()
    expect(
      await quoteCheckout(buyer, { ...input, voucherCode: '' }),
    ).toMatchObject({ discount: 0, grandTotal: 435000 })
  })
})
