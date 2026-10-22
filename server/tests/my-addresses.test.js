import { routeRequest } from './helpers/http.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'

const mocks = vi.hoisted(() => ({ where: vi.fn(), transaction: vi.fn(), update: vi.fn() }))
vi.mock('../src/database/index.js', () => ({ db: {
  delete: () => ({ where: mocks.where }), transaction: mocks.transaction,
  select: () => ({ from: () => ({ where: mocks.where }) }),
} }))
vi.mock('../src/lib/utils/environment.js', () => ({ clientUrl: 'http://localhost:5173' }))
vi.mock('../src/middlewares/auth.js', () => ({ requireAuth: async (_req,_res,next) => { await next() } }))
import router, { addressInput, addressPatch } from '../src/routes/my-addresses.js'
const owner = '00000000-0000-4000-8000-000000000001'
const addressId = '00000000-0000-4000-8000-000000000002'
const input = { recipientName: 'Test User', phone: '0901234567', addressLine: '24 Nguyễn Huệ', district: 'Quận 1', province: 'Hồ Chí Minh' }
function handler(method, path) { return routeRequest(router, method, path) }
function response() { return { code: 200, set() { return this }, status(code) { this.code = code; return this }, json: vi.fn() } }
beforeEach(() => vi.clearAllMocks())

describe('owned address book API', () => {
  it('rejects client-supplied owner IDs and unknown fields', () => {
    expect(addressInput.safeParse(input).success).toBe(true)
    expect(addressInput.safeParse({ ...input, userId: owner }).success).toBe(false)
    expect(addressInput.safeParse({ ...input, isAdmin: true }).success).toBe(false)
  })
  it('preserves other address fields when changing only the default flag', () => {
    expect(addressPatch.parse({ isDefault: true })).toEqual({ isDefault: true })
  })
  it('filters address listing by the authenticated user', async () => {
    mocks.where.mockReturnValue({ orderBy: async () => [] })
    const res = response()
    await handler('get', '/me/addresses')({ user: { id: owner } }, res, error => { throw error })
    const query = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0])
    expect(query.params).toEqual([owner])
    expect(query.sql).toContain('user_id')
    expect(res.json).toHaveBeenCalledWith([])
  })
  it('filters delete by both owner and ID; an unowned address returns 404', async () => {
    mocks.where.mockReturnValue({ returning: async () => [] })
    const res = response()
    await handler('delete', '/me/addresses/:id')({ user: { id: owner }, params: { id: addressId } }, res, error => { throw error })
    const query = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0])
    expect(query.params).toEqual([addressId, owner])
    expect(query.sql).toContain('user_id')
    expect(res.code).toBe(404)
  })
  it('does not start a write transaction for forged owner input', async () => {
    const next = vi.fn()
    await handler('post', '/me/addresses')({ user: { id: owner }, body: { ...input, userId: addressId } }, response(), next)
    expect(next).toHaveBeenCalledOnce()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})
