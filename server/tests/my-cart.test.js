import { routeRequest } from './helpers/http.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  rows: new Map(),
  updates: [],
  filters: [],
}))
vi.mock('../src/database/index.js', () => ({
  db: { transaction: mocks.transaction },
}))
vi.mock('../src/middlewares/auth.js', () => ({ requireAuth: async (_req,_res,next) => { await next() } }))
vi.mock('../src/lib/utils/environment.js', () => ({
  clientUrl: 'http://localhost:5173',
}))
import router from '../src/routes/my-cart.js'
import {
  carts,
  cartItems,
  productVariants,
  user,
} from '../src/database/schema.js'
const owner = '00000000-0000-4000-8000-000000000001'
const variant = '00000000-0000-4000-8000-000000000002'
const cartId = '00000000-0000-4000-8000-000000000003'
const handler = (method, path) => routeRequest(router, method, path)
const res = () => ({
  set() {
    return this
  },
  json: vi.fn(),
  status() {
    return this
  },
})
beforeEach(() => {
  vi.clearAllMocks()
  mocks.rows.clear()
  mocks.updates.length = 0
  mocks.filters.length = 0
  mocks.rows.set(user, [{ id: owner }])
  mocks.rows.set(carts, [{ id: cartId, userId: owner }])
  mocks.rows.set(productVariants, [{ id: variant, price: '200000' }])
  mocks.rows.set(cartItems, [{ id: owner, quantity: 3 }])
  const tx = {
    select: () => {
      let table,
        joined = false
      const query = {
        from(value) {
          table = value
          return query
        },
        where(filter) {
          mocks.filters.push(new PgDialect().sqlToQuery(filter))
          return query
        },
        for() {
          return query
        },
        innerJoin() {
          joined = true
          return query
        },
        then(resolve, reject) {
          return Promise.resolve(
            joined ? [] : (mocks.rows.get(table) ?? []),
          ).then(resolve, reject)
        },
      }
      return query
    },
    update: (table) => ({
      set: (data) => ({
        where: (filter) => {
          mocks.updates.push({
            table,
            data,
            query: new PgDialect().sqlToQuery(filter),
          })
          if (table === cartItems)
            mocks.rows.set(cartItems, [{ id: owner, quantity: data.quantity }])
          return []
        },
      }),
    }),
    delete: (table) => ({
      where: (filter) => {
        mocks.updates.push({ table, query: new PgDialect().sqlToQuery(filter) })
        return []
      },
    }),
  }
  mocks.transaction.mockImplementation((callback) => callback(tx))
})
describe('account cart API', () => {
  it('adds quantities using the database price and authenticated cart', async () => {
    await handler('post', '/me/cart/items')(
      { user: { id: owner }, body: { variantId: variant, quantity: 2 } },
      res(),
      (error) => {
        throw error
      },
    )
    expect(mocks.filters[0].params).toEqual([owner])
    expect(mocks.filters[1].params).toEqual([owner, 'active'])
    expect(mocks.updates[0].data).toMatchObject({
      quantity: 5,
      unitPrice: '200000',
    })
    expect(mocks.updates[0].query.params).toEqual([cartId, variant])
  })
  it('applies rapid delta requests cumulatively and clamps at one', async () => {
    mocks.rows.set(cartItems, [{ id: owner, quantity: 1 }])
    const adjust = handler('patch', '/me/cart/items/adjust')
    for (let i = 0; i < 2; i++)
      await adjust(
        { user: { id: owner }, body: { variantId: variant, delta: 1 } },
        res(),
        (error) => {
          throw error
        },
      )
    expect(mocks.updates.map((update) => update.data.quantity)).toEqual([2, 3])
    await adjust(
      { user: { id: owner }, body: { variantId: variant, delta: -99 } },
      res(),
      (error) => {
        throw error
      },
    )
    expect(mocks.updates.at(-1).data.quantity).toBe(1)
  })
  it('merges guest quantities without adding them repeatedly', async () => {
    for (let attempt = 0; attempt < 2; attempt++)
      await handler('post', '/me/cart/merge')(
        {
          user: { id: owner },
          body: { items: [{ variantId: variant, quantity: 2 }] },
        },
        res(),
        (error) => {
          throw error
        },
      )
    expect(mocks.updates.map((value) => value.data.quantity)).toEqual([3, 3])
  })
  it('deletes only the variant from the active cart owned by the session', async () => {
    await handler('delete', '/me/cart/items/:id')(
      { user: { id: owner }, params: { id: variant } },
      res(),
      (error) => {
        throw error
      },
    )
    expect(mocks.filters[1].params).toEqual([owner, 'active'])
    expect(mocks.updates[0].query.params).toEqual([cartId, variant])
  })
  it('rejects forged owners, prices and invalid quantities before starting a transaction', async () => {
    for (const change of [
      { userId: owner },
      { price: 1 },
      { quantity: 0 },
      { quantity: 100 },
      { quantity: 1.5 },
    ]) {
      const next = vi.fn()
      await handler('post', '/me/cart/items')(
        {
          user: { id: owner },
          body: { variantId: variant, quantity: 1, ...change },
        },
        res(),
        next,
      )
      expect(next).toHaveBeenCalledOnce()
    }
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})
