import {request as httpRequest} from './helpers/request.js';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
vi.mock('../src/lib/email/mailer.js', () => ({
  sendVerificationOtpEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendDeleteAccountEmail: vi.fn(),
}))
const enabled = process.env.RUN_PHASE1_POSTGRES_TESTS === 'true'
const prefix = 'P3-' + randomUUID()
let db, pool, s, auth, app, buyer, other, admin
const cookieOf = (response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
async function fixture(role = 'user', withGoogle = false) {
  const suffix = randomUUID()
  const [user] = await db
    .insert(s.user)
    .values({
      name: 'P3 ' + suffix,
      email: suffix + '@example.test',
      emailVerified: true,
      role,
    })
    .returning()
  const ctx = await auth.$context
  const [credential] = await db
    .insert(s.account)
    .values({
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: await ctx.password.hash('fixture-password-123'),
    })
    .returning()
  const google = withGoogle
    ? (
        await db
          .insert(s.account)
          .values({
            userId: user.id,
            providerId: 'google',
            accountId: 'subject-' + suffix,
          })
          .returning()
      )[0]
    : null
  const response = await auth.api.signInEmail({
    body: { email: user.email, password: 'fixture-password-123' },
    asResponse: true,
  })
  expect(response.status).toBe(200)
  return { user, credential, google, cookie: cookieOf(response) }
}
async function request(
  path,
  owner,
  body,
  method = body ? 'POST' : 'GET',
  origin,
) {
  const response = await httpRequest(app,path, {
    method,
    headers: {
      ...(owner ? { cookie: owner.cookie } : {}),
      origin:
        origin ??
        new URL((await import('../src/lib/utils/environment.js')).clientUrl)
          .origin,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return {
    status: response.status,
    data: await response.json(),
    headers: response.headers,
  }
}
const page = (owner, query = {}, adminScope = false) =>
  request(
    (adminScope ? '/admin/orders' : '/me/orders') +
      '?' +
      new URLSearchParams(query),
    owner,
  )
describe.skipIf(!enabled)(
  'Phase 3: actual PostgreSQL order pagination and account unlink serialization',
  () => {
    beforeAll(async () => {
      if (
        new URL(process.env.PHASE1_DATABASE_URL).hostname !== '127.0.0.1' ||
        process.env.DATABASE_URL !== process.env.PHASE1_DATABASE_URL
      )
        throw new Error('Disposable localhost database required')
      ;({ db, pool } = await import('../src/database/index.js'))
      s = await import('../src/database/schema.js')
      ;({ auth } = await import('../src/lib/auth/index.js'))
      app = (await import('../src/module.js')).default()
      buyer = await fixture()
      other = await fixture()
      admin = await fixture('master')
      await pool.query(
        `insert into sales_order(code,user_id,subtotal,grand_total,order_status,payment_status,created_at) select $1||'-'||i,$2,1000,1000,case when i%4=0 then 'completed'::order_status else 'pending'::order_status end,case when i%4=0 then 'paid'::payment_status else 'unpaid'::payment_status end,'2025-01-01T00:00:00.123456Z'::timestamptz+(i%2)*interval '333 microseconds' from generate_series(1,225) i`,
        [prefix, buyer.user.id],
      )
      await pool.query(
        'insert into sales_order(code,user_id,subtotal,grand_total) values($1,$2,1000,1000),($3,null,1000,1000)',
        [prefix + '-OTHER', other.user.id, prefix + '-GUEST'],
      )
      await pool.query(
        'insert into sales_order_item(order_id,sku,product_name,variant_name,unit_price,quantity,total) select id,$1,$2,$2,1000,2,2000 from sales_order where user_id=$3',
        [prefix + '-SKU', 'Snapshot product', buyer.user.id],
      )
    }, 30000)
    afterAll(async () => {
      await pool?.end()
    })
    it('walks all 225 owned orders with microsecond ties and no repeats when a new order arrives', async () => {
      let current = (await page(buyer, { limit: 25 })).data
      expect(current.total).toBe(225)
      const asOf = current.asOf,
        ids = current.items.map((item) => item.id)
      expect(current.items[0].itemCount).toBe(2)
      await pool.query(
        'insert into sales_order(code,user_id,subtotal,grand_total) values($1,$2,1000,1000)',
        [prefix + '-NEW', buyer.user.id],
      )
      while (current.hasMore) {
        const result = await page(buyer, {
          limit: 25,
          asOf,
          cursor: current.nextCursor,
        })
        expect(result.status).toBe(200)
        current = result.data
        expect(current.total).toBe(225)
        ids.push(...current.items.map((item) => item.id))
      }
      expect(ids).toHaveLength(225)
      expect(new Set(ids).size).toBe(225)
      expect(current.nextCursor).toBeNull()
      expect((await page(buyer, { limit: 25 })).data.total).toBe(226)
      const oldest = (await page(buyer, { sort: 'oldest', limit: 100 })).data
      let all = oldest.items.map((item) => item.id),
        next = oldest
      while (next.hasMore) {
        next = (
          await page(buyer, {
            sort: 'oldest',
            limit: 100,
            cursor: next.nextCursor,
          })
        ).data
        all.push(...next.items.map((item) => item.id))
      }
      expect(new Set(all).size).toBe(226)
    })
    it('enforces owner/admin authorization and binds cursors to filters and scope', async () => {
      expect((await page(null)).status).toBe(401)
      expect((await page(buyer, {}, true)).status).toBe(403)
      const first = (await page(buyer, { limit: 10 })).data
      expect(
        (await page(other, { limit: 10, cursor: first.nextCursor })).status,
      ).toBe(400)
      expect(
        (await page(admin, { limit: 10, cursor: first.nextCursor }, true))
          .status,
      ).toBe(400)
      expect(
        (
          await page(buyer, {
            limit: 10,
            q: 'changed',
            cursor: first.nextCursor,
          })
        ).status,
      ).toBe(400)
      expect(
        (await page(buyer, { limit: 10, cursor: first.nextCursor + 'x' }))
          .status,
      ).toBe(400)
      expect((await page(buyer, { userId: other.user.id })).status).toBe(400)
      const ownOther = (await page(other)).data
      expect(ownOther.total).toBe(1)
      expect(ownOther.items[0].code).toBe(prefix + '-OTHER')
      expect((await page(admin, { q: prefix }, true)).data.total).toBe(228)
    })
    it('searches snapshots/customer names in SQL and refreshes status-filtered totals', async () => {
      expect((await page(buyer, { q: prefix + '-SKU' })).data.total).toBe(225)
      const completed = (await page(buyer, { status: 'completed' })).data
      const count = (
        await pool.query(
          "select count(*)::int total from sales_order where user_id=$1 and order_status='completed'",
          [buyer.user.id],
        )
      ).rows[0].total
      expect(completed.total).toBe(count)
      const pending=(await page(buyer,{status:'pending'})).data
      const before=pending.total
      const changed=(await request('/order/sale/'+pending.items[0].id+'/status',admin,{status:'confirmed'},'PATCH')).data
      expect(changed.orderStatus).toBe('confirmed')
      expect((await page(buyer,{status:'pending'})).data.total).toBe(before-1)
      expect((await request('/order/sale/'+completed.items[0].id+'/status',admin,{status:'returned'},'PATCH')).status).toBe(409)
      const named = (await page(admin, { q: other.user.email }, true)).data
      expect(named.items).toHaveLength(1)
      expect(named.items[0].customerName).toBe(other.user.name)
      expect((await page(buyer, { q: '%' })).data.total).toBe(0)
    })
    it('opens legacy order snapshots only for their owner without creating payment actions', async () => {
      const id = (await page(other)).data.items[0].id
      const own = await request('/me/orders/' + id, other)
      expect(own.status).toBe(200)
      expect(own.data.managed).toBe(false)
      expect(own.data.payment.url).toBeNull()
      expect((await request('/me/orders/' + id, buyer)).status).toBe(404)
    })
    it('serializes simultaneous unlink operations so exactly one usable login remains', async () => {
      const person = await fixture('user', true)
      const results = await Promise.all(
        [person.credential.id, person.google.id].map((accountId) =>
          request('/auth/unlink-account', person, { accountId }),
        ),
      )
      expect(results.map((result) => result.status).sort()).toEqual([200, 409])
      expect(
        (
          await pool.query('select id from account where user_id=$1', [
            person.user.id,
          ])
        ).rows,
      ).toHaveLength(1)
    })
    it('rejects foreign accounts, stale/unverified sessions and malformed requests', async () => {
      const person = await fixture('user', true)
      expect(
        (
          await request('/auth/unlink-account', buyer, {
            accountId: person.google.id,
          })
        ).status,
      ).toBe(404)
      expect(
        (
          await request('/auth/unlink-account', person, {
            accountId: person.google.id,
            userId: buyer.user.id,
          })
        ).status,
      ).toBe(400)
      expect(
        (
          await request(
            '/auth/unlink-account',
            person,
            { accountId: person.google.id },
            'POST',
            'https://evil.test',
          )
        ).status,
      ).toBe(403)
      await pool.query(
        "update session set created_at=now()-interval '10 minutes' where user_id=$1",
        [person.user.id],
      )
      expect(
        (
          await request('/auth/unlink-account', person, {
            accountId: person.google.id,
          })
        ).status,
      ).toBe(403)
      const unverified = await fixture('user', true)
      await pool.query('update "user" set email_verified=false where id=$1', [
        unverified.user.id,
      ])
      expect(
        (
          await request('/auth/unlink-account', unverified, {
            accountId: unverified.google.id,
          })
        ).status,
      ).toBe(403)
    })
    it('does not count a disabled provider or empty provider identity as a usable last login', async () => {
      const person = await fixture('user', true),
        configured = process.env.GOOGLE_CLIENT_SECRET
      try {
        process.env.GOOGLE_CLIENT_SECRET = ''
        expect(
          (
            await request('/auth/unlink-account', person, {
              accountId: person.credential.id,
            })
          ).status,
        ).toBe(409)
      } finally {
        process.env.GOOGLE_CLIENT_SECRET = configured
      }
      await pool.query('update account set account_id=$1 where id=$2', [
        '',
        person.google.id,
      ])
      expect(
        (
          await request('/auth/unlink-account', person, {
            accountId: person.credential.id,
          })
        ).status,
      ).toBe(409)
    })
    it('enforces unique provider/subject ownership at the database boundary', async () => {
      const person = await fixture('user', true)
      await expect(
        pool.query(
          'insert into account(user_id,provider_id,account_id,updated_at) values($1,$2,$3,now())',
          [buyer.user.id, 'google', person.google.accountId],
        ),
      ).rejects.toMatchObject({ code: '23505' })
      expect(
        (
          await pool.query(
            'select user_id from account where provider_id=$1 and account_id=$2',
            ['google', person.google.accountId],
          )
        ).rows[0].user_id,
      ).toBe(person.user.id)
    })
  },
)
