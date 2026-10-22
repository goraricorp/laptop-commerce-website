import { describe, expect, it } from 'vitest'
import { orderCursorCodec, orderListInput } from '../src/lib/orders/cursor.js'
const codec = orderCursorCodec('test-secret-32-characters-only-fixture')
const payload = {
  v: 1,
  at: '2026-10-21T00:00:00.123456Z',
  asOf: '2026-10-21T01:00:00.123789Z',
  id: '00000000-0000-4000-8000-000000000001',
  scope: 'me:user',
  filter: 'fixture',
}
describe('signed order cursor', () => {
  it('preserves PostgreSQL microseconds and detects tampering', () => {
    const cursor = codec.encode(payload)
    expect(codec.decode(cursor)).toEqual(payload)
    expect(() =>
      codec.decode(cursor.slice(0, 5) + 'X' + cursor.slice(6)),
    ).toThrow()
    expect(() => codec.decode(cursor + '.extra')).toThrow()
    expect(() => codec.decode('garbage')).toThrow()
  })
  it('bounds pagination and rejects owner injection and unsupported parameters', () => {
    for (const input of [
      { limit: 101 },
      { limit: 0 },
      { page: 2 },
      { userId: payload.id },
      { sort: 'price' },
      { asOf: 'bad' },
    ])
      expect(orderListInput.safeParse(input).success).toBe(false)
    expect(orderListInput.parse({})).toMatchObject({
      limit: 25,
      status: 'all',
      sort: 'newest',
    })
  })
})
