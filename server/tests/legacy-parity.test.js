import { routeRequest } from './helpers/http.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
const mocks = vi.hoisted(() => ({
  where: vi.fn(),
  set: vi.fn(),
  transaction: vi.fn(),
}))
vi.mock('../src/database/index.js', () => ({
  db: {
    select: () => ({ from: () => ({ where: mocks.where }) }),
    update: () => ({ set: mocks.set }),
    delete: () => ({ where: mocks.where }),
    transaction: mocks.transaction,
  },
}))
vi.mock('../src/middlewares/auth.js', () => ({ requireAuth: async (_req,_res,next) => { await next() } }))
vi.mock('../src/lib/utils/environment.js', () => ({
  clientUrl: 'http://localhost:5173',
}))
import { updateOwnedReview, deleteOwnedReview } from '../src/services/review.js'
import reviewRouter from '../src/routes/review.js'
import statsRouter, { statisticsInput } from '../src/routes/statistics.js'
const owner = '00000000-0000-4000-8000-000000000001'
const id = '00000000-0000-4000-8000-000000000002'
const handler = (router, method, path) => routeRequest(router, method, path)
const response = () => ({
  code: 200,
  set() {
    return this
  },
  status(code) {
    this.code = code
    return this
  },
  json: vi.fn(),
})
beforeEach(() => {
  vi.clearAllMocks()
  mocks.where.mockReturnValue({ returning: async () => [] })
  mocks.set.mockReturnValue({ where: mocks.where })
})
describe('legacy parity authorization and reporting', () => {
  it('restricts review writes to both ID and authenticated owner, and requires moderation again', async () => {
    await updateOwnedReview(id, owner, { score: 4, comment: 'Updated' })
    expect(mocks.set.mock.calls[0][0]).toMatchObject({
      score: 4,
      status: 'pending',
    })
    expect(
      new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]).params,
    ).toEqual([id, owner])
    await deleteOwnedReview(id, owner)
    expect(
      new PgDialect().sqlToQuery(mocks.where.mock.calls[1][0]).params,
    ).toEqual([id, owner])
  })
  it('rejects forged ownership and moderation fields before touching reviews', async () => {
    for (const extra of [
      { userId: id },
      { status: 'published' },
      { isVerifiedPurchase: true },
      { productId: id },
    ]) {
      const next = vi.fn()
      await handler(reviewRouter, 'patch', '/me/reviews/:id')(
        { params: { id }, user: { id: owner }, body: { score: 5, ...extra } },
        response(),
        next,
      )
      expect(next).toHaveBeenCalledOnce()
    }
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it('returns 404 for deletion of another customer review', async () => {
    const res = response()
    await handler(reviewRouter, 'delete', '/me/reviews/:id')(
      { params: { id }, user: { id: owner } },
      res,
      (error) => {
        throw error
      },
    )
    expect(res.code).toBe(404)
  })
  it('validates date ranges including invalid calendar dates', () => {
    expect(statisticsInput.safeParse({ from: '2026-02-30' }).success).toBe(
      false,
    )
    expect(
      statisticsInput.safeParse({ from: '2026-10-22', to: '2026-10-21' })
        .success,
    ).toBe(false)
    expect(
      statisticsInput.safeParse({ from: '2026-10-21', to: '2026-10-21' })
        .success,
    ).toBe(true)
  })
  it('paginates all history with Vietnam day boundaries independently of the aggregates', async () => {
    let range, offset
    const tx = {
      select: vi.fn().mockImplementation((fields) => {
        let joined = false
        const query = {
          from() {
            return query
          },
          leftJoin() {
            joined = true
            return query
          },
          innerJoin() {
            return query
          },
          where(filter) {
            if (fields?.totalOrders) range = new PgDialect().sqlToQuery(filter)
            return query
          },
          orderBy() {
            return query
          },
          limit() {
            return query
          },
          offset(value) {
            offset = value
            return query
          },
          then(resolve) {
            return resolve(
              fields?.totalOrders
                ? [
                    {
                      totalOrders: 321,
                      collected: '125000000',
                      refunded: '2000000',
                      pendingOrders: '121',
                    },
                  ]
                : fields?.lowStock
                  ? [{ total: 250, lowStock: '130' }]
                  : joined && !fields?.total
                    ? []
                    : [{ total: 300 }],
            )
          },
        }
        return query
      }),
    }
    mocks.transaction.mockImplementation(async (callback) => callback(tx))
    const res = response()
    await handler(statsRouter, 'get', '/admin/statistics')(
      { query: { from: '2026-10-21', to: '2026-10-21', page: 5, limit: 25 } },
      res,
      (error) => {
        throw error
      },
    )
    expect(offset).toBe(100)
    expect(range.params.map((value) => new Date(value).toISOString())).toEqual([
      '2026-10-20T17:00:00.000Z',
      '2026-10-21T17:00:00.000Z',
    ])
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        totalOrders: 321,
        pendingOrders: 121,
        lowStock: 130,
        revenue: 123000000,
      }),
    )
  })
})
