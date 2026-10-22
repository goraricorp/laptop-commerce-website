import { describe, expect, it } from 'vitest'
import {
  assertSettlement,
  checkoutInput,
  fingerprint,
  placeInput,
  vndAmount,
} from '../src/lib/checkout/contracts.js'
const input = {
  items: [{ variantId: '00000000-0000-4000-8000-000000000001', quantity: 1 }],
  addressId: '00000000-0000-4000-8000-000000000002',
  provider: 'cod',
}
describe('checkout request integrity', () => {
  it('rejects client prices, totals, user IDs and arbitrary shipping addresses', () => {
    expect(checkoutInput.safeParse(input).success).toBe(true)
    for (const extra of [
      { total: 1 },
      { userId: input.addressId },
      { address: 'anything' },
    ])
      expect(checkoutInput.safeParse({ ...input, ...extra }).success).toBe(
        false,
      )
    expect(
      checkoutInput.safeParse({
        ...input,
        items: [{ ...input.items[0], price: 1 }],
      }).success,
    ).toBe(false)
  })
  it('requires quote proof and rejects duplicate or excessive quantities', () => {
    expect(
      placeInput.safeParse({ requestKey: input.addressId, checkout: input })
        .success,
    ).toBe(false)
    expect(
      checkoutInput.safeParse({
        ...input,
        items: [input.items[0], input.items[0]],
      }).success,
    ).toBe(false)
    for (const quantity of [0, -1, 0.5, 100])
      expect(
        checkoutInput.safeParse({
          ...input,
          items: [{ ...input.items[0], quantity }],
        }).success,
      ).toBe(false)
  })
  it('only accepts positive whole VND amounts', () => {
    expect(vndAmount('150000.00')).toBe(150000)
    for (const value of ['0', '-1', '1.50', 'NaN', Infinity])
      expect(() => vndAmount(value)).toThrow()
  })
  it('binds settlement to provider ID, exact amount and currency', () => {
    const session = {
      providerOrderId: 'gateway-order',
      providerAmount: '2.00',
      currency: 'USD',
    }
    const result = {
      state: 'paid',
      transactionId: 'capture-id',
      providerId: 'gateway-order',
      amount: '2.00',
      currency: 'USD',
    }
    expect(() => assertSettlement(session, result)).not.toThrow()
    for (const change of [
      { providerId: 'another' },
      { amount: '1.99' },
      { currency: 'VND' },
    ])
      expect(() =>
        assertSettlement(session, { ...result, ...change }),
      ).toThrow()
  })
  it('makes a stable request fingerprint independently of cart ordering', () => {
    const parsed = checkoutInput.parse(input)
    const second = { variantId: input.addressId, quantity: 2 }
    expect(fingerprint({ ...parsed, items: [...parsed.items, second] })).toBe(
      fingerprint({ ...parsed, items: [second, ...parsed.items] }),
    )
    expect(fingerprint(parsed)).not.toBe(
      fingerprint({ ...parsed, provider: 'stripe' }),
    )
  })
})
