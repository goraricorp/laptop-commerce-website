import { describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
vi.mock('../src/database/index.js', () => ({ db: {} }))
vi.mock('../src/services/payment-gateways.js', () => ({
  assertGateway: vi.fn(),
  settlementAmount: vi.fn(),
  createGatewayPayment: vi.fn(),
  gatewayRequestId: vi.fn(),
  queryGatewayPayment: vi.fn(),
}))
import { clearPurchasedCart, restoreVoucher } from '../src/services/checkout.js'
import {
  cartItems,
  checkoutSessions,
  promotionCodes,
  promotionUsages,
} from '../src/database/schema.js'
const id = '00000000-0000-4000-8000-000000000001'
function fixture(quantity) {
  const writes = []
  const tx = {
    select: () => ({
      from: () => ({
        where: () => ({
          for: async () => (quantity === null ? [] : [{ id, quantity }]),
        }),
      }),
    }),
    update: (table) => ({
      set: (data) => ({
        where: (condition) => {
          writes.push({
            table,
            data,
            condition: new PgDialect().sqlToQuery(condition),
          })
          return []
        },
      }),
    }),
    delete: (table) => ({
      where: (condition) => {
        writes.push({ table, condition: new PgDialect().sqlToQuery(condition) })
        return { returning: async () => [] }
      },
    }),
  }
  return { tx, writes }
}
describe('server-owned checkout cleanup', () => {
  it('subtracts only purchased quantities from captured cart item IDs', async () => {
    const { tx, writes } = fixture(5)
    await clearPurchasedCart(tx, { id, cartSnapshot: [{ id, quantity: 2 }] })
    expect(writes[0]).toMatchObject({
      table: cartItems,
      data: { quantity: 3 },
      condition: { params: [id] },
    })
    expect(writes[1].table).toBe(checkoutSessions)
  })
  it('deletes bought items and records completion even if the original cart item was removed', async () => {
    const present = fixture(1)
    await clearPurchasedCart(present.tx, {
      id,
      cartSnapshot: [{ id, quantity: 1 }],
    })
    expect(present.writes[0].table).toBe(cartItems)
    const absent = fixture(null)
    await clearPurchasedCart(absent.tx, {
      id,
      cartSnapshot: [{ id, quantity: 1 }],
    })
    expect(absent.writes).toHaveLength(1)
    expect(absent.writes[0].table).toBe(checkoutSessions)
  })
  it('never subtracts the same purchase twice', async () => {
    const { tx, writes } = fixture(5)
    await clearPurchasedCart(tx, {
      id,
      cartClearedAt: new Date(),
      cartSnapshot: [{ id, quantity: 2 }],
    })
    expect(writes).toHaveLength(0)
  })
  it('restores usage once, using deleted usage rows as proof and clamping the counter', async () => {
    const { tx, writes } = fixture(null)
    const returning = vi
      .fn()
      .mockResolvedValueOnce([{ promotionCodeId: id }])
      .mockResolvedValueOnce([])
    tx.delete = (table) => ({
      where: (condition) => {
        expect(table).toBe(promotionUsages)
        expect(new PgDialect().sqlToQuery(condition).params).toEqual([id])
        return { returning }
      },
    })
    await restoreVoucher(tx, id)
    await restoreVoucher(tx, id)
    expect(writes).toHaveLength(1)
    expect(writes[0].table).toBe(promotionCodes)
    expect(new PgDialect().sqlToQuery(writes[0].data.usedCount).sql).toContain(
      'greatest(0,',
    )
  })
})
