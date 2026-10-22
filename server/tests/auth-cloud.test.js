import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'

vi.mock('../src/lib/email/mailer.js', () => ({
  sendVerificationOtpEmail: vi.fn(), sendPasswordResetEmail: vi.fn(), sendDeleteAccountEmail: vi.fn(),
}))
import { sendVerificationOtpEmail } from '../src/lib/email/mailer.js'

// Explicit opt-in: default tests never connect to or mutate a cloud database.
describe.skipIf(process.env.RUN_CLOUD_AUTH_TESTS !== 'true')('Neon + Drizzle RC Relations v2 integration', () => {
  let auth
  let db
  let pool
  let user
  let userId
  const suffix = randomUUID().replaceAll('-', '').slice(0, 16)
  const email = `auth-vitest-${suffix}@example.com`
  const username = `vitest_${suffix}`

  beforeAll(async () => {
    ;({ auth } = await import('../src/lib/auth/index.js'))
    ;({ db, pool } = await import('../src/database/index.js'))
    ;({ user } = await import('../src/database/auth-schema.js'))
    await auth.$context
  })

  afterAll(async () => {
    try {
      if (userId) await db.delete(user).where(eq(user.id, userId))
      else if (db && user) await db.delete(user).where(eq(user.email, email))
    } finally { await pool?.end() }
  })

  it('registers, verifies, logs in, queries relations and revokes a real database session', async () => {
    const signup = await auth.api.signUpEmail({ body: { name: 'Vitest disposable fixture', email, username, password: 'vitest-password-12345' } })
    userId = signup.user.id
    expect(signup.user.role).toBe('user')
    expect(signup.user.username).toBe(username)
    const { otp } = sendVerificationOtpEmail.mock.calls.at(-1)[0]
    await auth.api.verifyEmailOTP({ body: { email, otp } })
    const response = await auth.api.signInUsername({ body: { username, password: 'vitest-password-12345' }, asResponse: true })
    expect(response.status).toBe(200)
    const cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')
    const headers = new Headers({ cookie })
    expect((await auth.api.getSession({ headers })).user.id).toBe(userId)
    const rows = await db.query.user.findMany({ where: { id: userId }, with: { accounts: true, sessions: true } })
    expect(rows[0].accounts[0].providerId).toBe('credential')
    expect(rows[0].sessions.length).toBeGreaterThan(0)
    expect(rows[0].banned).toBe(false)
    await auth.api.signOut({ headers })
    expect(await auth.api.getSession({ headers })).toBeNull()
  }, 30000)
})
