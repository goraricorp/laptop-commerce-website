import { describe, expect, it, vi } from 'vitest'
vi.mock('../src/database/index.js', () => ({ db: {} }))
import {
  inventoryTransaction,
  sortPairs,
} from '../src/services/stock-ledger.js'
import { movementInput, transferInput } from '../src/schemas/inventory.js'
const source = '00000000-0000-4000-8000-000000000001',
  target = '00000000-0000-4000-8000-000000000002'
describe('inventory retry and validation contracts', () => {
  it('retries only aborted PostgreSQL transactions and bounds attempts', async () => {
    const transaction = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error(), { code: '40001' }))
      .mockRejectedValueOnce({ cause: { code: '40P01' } })
      .mockResolvedValue('ok')
    expect(await inventoryTransaction(vi.fn(), { transaction })).toBe('ok')
    expect(transaction).toHaveBeenCalledTimes(3)
    const persistent = vi.fn().mockRejectedValue({ code: '40P01' })
    await expect(
      inventoryTransaction(vi.fn(), { transaction: persistent }),
    ).rejects.toMatchObject({ code: '40P01' })
    expect(persistent).toHaveBeenCalledTimes(3)
    const business = vi.fn().mockRejectedValue({ status: 409 })
    await expect(
      inventoryTransaction(vi.fn(), { transaction: business }),
    ).rejects.toMatchObject({ status: 409 })
    expect(business).toHaveBeenCalledOnce()
  })
  it('rejects invalid counts, reserved-stock commands and forged audit fields', () => {
    const input = {
      operationId: source,
      locationId: source,
      variantId: target,
      type: 'receipt',
      quantity: 1,
      note: 'Receipt',
    }
    expect(movementInput.safeParse(input).success).toBe(true)
    for (const extra of [
      { quantity: 0 },
      { quantity: NaN },
      { quantity: 1.5 },
      { quantity: -1 },
      { quantity: 2147483648 },
      { actorId: target },
      { onHandDelta: 1 },
      { type: 'reservation' },
      { note: '' },
    ])
      expect(movementInput.safeParse({ ...input, ...extra }).success).toBe(
        false,
      )
    expect(
      movementInput.safeParse({ ...input, type: 'adjustment', quantity: -1 })
        .success,
    ).toBe(true)
    const transfer = {
      operationId: source,
      sourceLocationId: source,
      targetLocationId: target,
      variantId: source,
      quantity: 1,
      note: 'Transfer',
    }
    expect(transferInput.safeParse(transfer).success).toBe(true)
    expect(
      transferInput.safeParse({ ...transfer, targetLocationId: source })
        .success,
    ).toBe(false)
  })
  it('uses one order for all location/SKU locks and deduplicates pairs', () => {
    const pair = { locationId: source, variantId: target },
      other = { locationId: target, variantId: source }
    expect(sortPairs([other, pair, pair])).toEqual([pair, other])
  })
})
