import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
const state = vi.hoisted(() => ({
  transaction: vi.fn(),
  existing: false,
  insert: vi.fn(),
  filters: [],
}))
vi.mock('../src/database/index.js', () => ({
  db: { transaction: state.transaction },
}))
import { createProductReview } from '../src/services/review.js'
import { productReviews, user } from '../src/database/schema.js'
const input = {
  userId: '00000000-0000-4000-8000-000000000001',
  productId: '00000000-0000-4000-8000-000000000002',
  score: 4,
  status: 'pending',
}
beforeEach(() => {
  vi.clearAllMocks()
  state.existing = false
  state.filters.length = 0
  const tx = {
    select: () => {
      let table
      const q = {
        from(value) {
          table = value
          return q
        },
        where(condition) {
          state.filters.push(new PgDialect().sqlToQuery(condition))
          return q
        },
        for() {
          return q
        },
        then(resolve) {
          return resolve(
            table === user
              ? [{ id: input.userId }]
              : state.existing
                ? [{ id: input.productId }]
                : [],
          )
        },
      }
      return q
    },
    insert: state.insert,
  }
  state.transaction.mockImplementation((callback) => callback(tx))
})
describe('one review per account/product', () => {
  it('checks the owner/product pair while holding the account lock', async () => {
    state.existing = true
    await expect(createProductReview(input)).rejects.toMatchObject({
      status: 409,
    })
    expect(state.filters[1].params).toEqual([input.userId, input.productId])
    expect(state.insert).not.toHaveBeenCalled()
  })
  it('translates a concurrent unique constraint conflict into a usable 409 response', async () => {
    state.insert.mockReturnValue({
      values: () => ({
        returning: () => {
          throw Object.assign(new Error('unique'), { code: '23505' })
        },
      }),
    })
    await expect(createProductReview(input)).rejects.toMatchObject({
      status: 409,
    })
    expect(productReviews.userId).toBeDefined()
  })
})
