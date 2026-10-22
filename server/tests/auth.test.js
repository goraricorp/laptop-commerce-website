import { beforeEach, describe, expect, it, vi } from 'vitest'
import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'

vi.mock('../src/lib/utils/environment.js', () => ({
  betterAuthApiKey: undefined,
  betterAuthSecret: 'vitest-only-auth-secret-with-at-least-32-characters',
  betterAuthUrl: 'http://localhost:5172', clientUrl: 'http://localhost:5173',
}))
vi.mock('../src/lib/email/mailer.js', () => ({
  sendVerificationOtpEmail: vi.fn(), sendPasswordResetEmail: vi.fn(), sendDeleteAccountEmail: vi.fn(),
}))

import { authOptions } from '../src/lib/auth/options.js'
import { sendPasswordResetEmail, sendVerificationOtpEmail } from '../src/lib/email/mailer.js'

let auth
let store
async function request(path, body, cookie, origin = 'http://localhost:5173') {
  const response = await auth.handler(new Request(`http://localhost:5172/auth${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'x-forwarded-for': '127.0.0.1', ...(cookie ? { Cookie: cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }))
  return { status: response.status, body: await response.json(), cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') }
}
const credentials = { name: 'Test User', email: 'user@example.com', username: 'Test.User', password: 'secure-password-123' }
async function verifiedUser() {
  const signedUp = await request('/sign-up/email', credentials)
  expect(signedUp.status).toBe(200)
  const { otp } = sendVerificationOtpEmail.mock.calls.at(-1)[0]
  return request('/email-otp/verify-email', { email: credentials.email, otp })
}

beforeEach(() => {
  vi.clearAllMocks()
  store = { user: [], session: [], account: [], verification: [], rateLimit: [] }
  auth = betterAuth({ ...authOptions, database: memoryAdapter(store) })
})

describe('Better Auth package flows with application configuration', () => {
  it('serves the package health endpoint and does not expose legacy table CRUD routes', async () => {
    expect((await request('/ok')).body).toMatchObject({ ok: true })
    for (const path of ['/session', '/verification']) {
      const response = await auth.handler(new Request(`http://localhost:5172/auth${path}`))
      expect(response.status).toBe(404)
    }
  })

  it('registers with normalized unique username, hashes password and OTP, rejects injected role', async () => {
    const injected = await request('/sign-up/email', { ...credentials, role: 'master' })
    expect(injected.status).toBe(400)
    const result = await request('/sign-up/email', credentials)
    expect(result.status).toBe(200)
    expect(result.body.user).toMatchObject({ username: 'test.user', displayUsername: 'Test.User', role: 'user', emailVerified: false })
    expect(result.body.token).toBeNull()
    expect(store.account[0].password).not.toBe(credentials.password)
    const { otp } = sendVerificationOtpEmail.mock.calls.at(-1)[0]
    expect(store.verification[0].value).not.toContain(otp)
    const duplicate = await request('/sign-up/email', { ...credentials, email: 'second@example.com', username: 'test.USER' })
    expect(duplicate.status).toBeGreaterThanOrEqual(400)
  })

  it('blocks unverified email login and invalid username input', async () => {
    await request('/sign-up/email', credentials)
    const login = await request('/sign-in/email', { email: credentials.email, password: credentials.password })
    expect(login.body.code).toBe('EMAIL_NOT_VERIFIED')
    const invalid = await request('/sign-up/email', { ...credentials, email: 'second@example.com', username: 'bad name!' })
    expect(invalid.status).toBeGreaterThanOrEqual(400)
  })

  it('verifies OTP, signs in by username, reads session and revokes it on logout', async () => {
    await verifiedUser()
    const login = await request('/sign-in/username', { username: 'TEST.USER', password: credentials.password })
    expect(login.status).toBe(200)
    const session = await request('/get-session', undefined, login.cookie)
    expect(session.body.user.username).toBe('test.user')
    const logout = await request('/sign-out', {}, login.cookie)
    expect(logout.status).toBe(200)
    expect((await request('/get-session', undefined, login.cookie)).body).toBeNull()
  })

  it('rejects wrong OTP and enforces the plugin attempt limit', async () => {
    await request('/sign-up/email', credentials)
    const { otp } = sendVerificationOtpEmail.mock.calls.at(-1)[0]
    const wrong = otp === '000000' ? '111111' : '000000'
    for (let attempt = 0; attempt < 4; attempt++) {
      const result = await request('/email-otp/verify-email', { email: credentials.email, otp: wrong })
      expect(result.status).toBeGreaterThanOrEqual(400)
    }
    const result = await request('/email-otp/verify-email', { email: credentials.email, otp })
    expect(result.status).toBeGreaterThanOrEqual(400)
    expect(store.user[0].emailVerified).toBe(false)
  })

  it('resets password with a single-use token and revokes existing sessions', async () => {
    const verified = await verifiedUser()
    const login = await request('/sign-in/email', { email: credentials.email, password: credentials.password })
    expect(login.status).toBe(200)
    const reset = await request('/request-password-reset', { email: credentials.email, redirectTo: 'http://localhost:5173/auth/reset-password' })
    expect(reset.status).toBe(200)
    const url = new URL(sendPasswordResetEmail.mock.calls.at(-1)[0].url)
    const token = url.pathname.split('/').at(-1)
    const newPassword = 'new-secure-password-456'
    expect((await request('/reset-password', { token, newPassword })).status).toBe(200)
    expect((await request('/get-session', undefined, login.cookie)).body).toBeNull()
    expect((await request('/reset-password', { token, newPassword })).status).toBeGreaterThanOrEqual(400)
    expect((await request('/sign-in/email', { email: credentials.email, password: newPassword })).status).toBe(200)
    expect(verified.status).toBe(200)
  })

  it('rejects expired OTP using server time', async () => {
    await request('/sign-up/email', credentials)
    const { otp } = sendVerificationOtpEmail.mock.calls.at(-1)[0]
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(Date.now() + 301000)
      const expired = await request('/email-otp/verify-email', { email: credentials.email, otp })
      expect(expired.body.code).toBe('OTP_EXPIRED')
      expect(store.user[0].emailVerified).toBe(false)
    } finally { vi.useRealTimers() }
  })

  it('rejects incorrect passwords and lets the username plugin update a username', async () => {
    const verified = await verifiedUser()
    expect((await request('/sign-in/username', { username: credentials.username, password: 'wrong-password' })).status).toBe(401)
    expect((await request('/update-user', { username: 'New.User' }, verified.cookie)).status).toBe(200)
    expect(store.user[0].username).toBe('new.user')
  })

  it('prevents self-service role elevation and denies admin APIs to regular users', async () => {
    const verified = await verifiedUser()
    await request('/update-user', { role: 'master' }, verified.cookie)
    expect(store.user[0].role).toBe('user')
    expect((await request('/admin/list-users', undefined, verified.cookie)).status).toBe(403)
    expect((await request('/admin/update-user', { userId: store.user[0].id, data: { role: 'master' } }, verified.cookie)).status).toBe(403)
  })

  it('uses package permissions: administrator cannot mutate users or grant master', async () => {
    const verified = await verifiedUser()
    store.user[0].role = 'administrator'
    expect((await request('/admin/list-users', undefined, verified.cookie)).status).toBe(200)
    expect((await request('/admin/set-role', { userId: store.user[0].id, role: 'master' }, verified.cookie)).status).toBe(403)
    expect((await request('/admin/update-user', { userId: store.user[0].id, data: { name: 'Changed' } }, verified.cookie)).status).toBe(403)
  })

  it('allows master to manage users through the Admin plugin', async () => {
    const verified = await verifiedUser()
    store.user[0].role = 'master'
    expect((await request('/admin/list-users', undefined, verified.cookie)).status).toBe(200)
    expect((await request('/admin/update-user', { userId: store.user[0].id, data: { name: 'Updated' } }, verified.cookie)).status).toBe(200)
    expect(store.user[0].name).toBe('Updated')
  })

  it('rejects untrusted origins and rate limits authentication requests', async () => {
    expect((await request('/sign-up/email', credentials, undefined, 'https://untrusted.example')).status).toBe(403)
    const responses = []
    for (let attempt = 0; attempt < 5; attempt++) responses.push(await request('/sign-in/email', { email: credentials.email, password: 'wrong-password' }))
    expect(responses.some(response => response.status === 429)).toBe(true)
  })
})
