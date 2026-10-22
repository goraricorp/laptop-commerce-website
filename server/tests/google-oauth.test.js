import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
vi.mock('../src/lib/utils/environment.js', () => ({
  clientUrl: 'https://shop.example',
  betterAuthUrl: 'https://api.shop.example/auth',
  betterAuthApiKey: undefined,
  betterAuthSecret: 'google-oauth-test-fixture-secret-32-characters',
}))
vi.mock('../src/lib/email/mailer.js', () => ({
  sendVerificationOtpEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendDeleteAccountEmail: vi.fn(),
}))
import { authOptions } from '../src/lib/auth/options.js'
import { googleOptions } from '../src/lib/auth/google.js'
let auth, store, provider, profile, codeVerifier
const cookieOf = (response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
const request = (path, body, cookie) =>
  auth.handler(
    new Request('https://api.shop.example/auth' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        origin: 'https://shop.example',
        'content-type': 'application/json',
        ...(cookie ? { cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  )
async function localUser(
  email = 'google-fixture@example.test',
  verified = true,
) {
  const ctx = await auth.$context
  const user = {
    id: crypto.randomUUID(),
    name: 'Local fixture',
    email,
    emailVerified: verified,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'user',
  }
  store.user.push(user)
  store.account.push({
    id: crypto.randomUUID(),
    userId: user.id,
    providerId: 'credential',
    accountId: user.id,
    password: await ctx.password.hash('fixture-password-123'),
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const session = await ctx.internalAdapter.createSession(user.id)
  const response = await request('/sign-in/email', {
    email,
    password: 'fixture-password-123',
  })
  return { user, cookie: verified ? cookieOf(response) : null, session }
}
async function start(path = '/sign-in/social', cookie) {
  const response = await request(
    path,
    {
      provider: 'google',
      callbackURL: 'https://shop.example/settings/connections',
      errorCallbackURL: 'https://shop.example/auth/error',
    },
    cookie,
  )
  expect(response.status).toBe(200)
  const url = new URL((await response.json()).url)
  expect(url.searchParams.get('code_challenge_method')).toBe('S256')
  expect(url.searchParams.get('redirect_uri')).toBe(
    'https://api.shop.example/auth/callback/google',
  )
  return {
    state: url.searchParams.get('state'),
    cookie: [cookie, cookieOf(response)].filter(Boolean).join('; '),
  }
}
const callback = (flow) =>
  request(
    '/callback/google?' +
      new URLSearchParams({ code: 'provider-code', state: flow.state }),
    undefined,
    flow.cookie,
  )
beforeEach(async () => {
  vi.stubEnv('GOOGLE_CLIENT_ID', 'test-google-client')
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-google-secret')
  store = {
    user: [],
    session: [],
    account: [],
    verification: [],
    rateLimit: [],
  }
  auth = betterAuth({
    ...authOptions,
    socialProviders: googleOptions(),
    database: memoryAdapter(store),
    logger: { disabled: true },
  })
  const ctx = await auth.$context
  provider = await (typeof ctx.socialProviders[0] === 'function'
    ? ctx.socialProviders[0]()
    : ctx.socialProviders[0])
  profile = {
    sub: 'google-subject',
    email: 'google-fixture@example.test',
    email_verified: true,
    name: 'Google fixture',
  }
  const originalCreate = provider.createAuthorizationURL
  provider.createAuthorizationURL = vi.fn(async (options) => {
    codeVerifier = options.codeVerifier
    return originalCreate(options)
  })
  provider.validateAuthorizationCode = vi.fn(async (options) => {
    expect(options.codeVerifier).toBe(codeVerifier)
    return {
      accessToken: 'opaque-access-fixture',
      refreshToken: 'opaque-refresh-fixture',
      scopes: ['openid', 'email', 'profile'],
    }
  })
  provider.getUserInfo = vi.fn(async () => ({
    user: {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      emailVerified: profile.email_verified,
    },
    data: profile,
  }))
  ctx.socialProviders = [provider]
})
afterEach(() => vi.unstubAllEnvs())
describe('Better Auth 1.7.11 Google flows (provider adapter mocked)', () => {
  it('uses real state/PKCE and creates a verified Google account without trusting browser identity', async () => {
    const flow = await start()
    expect(codeVerifier.length).toBeGreaterThan(64)
    const response = await callback(flow)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(
      'https://shop.example/settings/connections',
    )
    expect(store.user[0].role).toBe('user')
    expect(store.account[0]).toMatchObject({
      providerId: 'google',
      accountId: 'google-subject',
    })
    expect(store.account[0].accessToken).not.toBe('opaque-access-fixture')
    expect(
      (
        await auth.api.getSession({
          headers: new Headers({ cookie: cookieOf(response) }),
        })
      ).user.emailVerified,
    ).toBe(true)
  })
  it('rejects same-email implicit linking for verified and unverified local users', async () => {
    for (const verified of [true, false]) {
      store.user.length = 0
      store.account.length = 0
      await localUser(undefined, verified)
      const response = await callback(await start())
      expect(
        new URL(response.headers.get('location')).searchParams.get('error'),
      ).toBe('account_not_linked')
      expect(store.account).toHaveLength(1)
    }
  })
  it('links explicitly only for the same verified local account in a recent session', async () => {
    const local = await localUser()
    const response = await callback(await start('/link-social', local.cookie))
    expect(response.headers.get('location')).toBe(
      'https://shop.example/settings/connections',
    )
    expect(
      store.account.find((item) => item.providerId === 'google').userId,
    ).toBe(local.user.id)
    const login = await callback(await start())
    expect(
      (
        await auth.api.getSession({
          headers: new Headers({ cookie: cookieOf(login) }),
        })
      ).user.id,
    ).toBe(local.user.id)
  })
  it('rejects unverified Google identities and mismatched Google email when linking', async () => {
    const local = await localUser()
    profile.email_verified = false
    let response = await callback(await start('/link-social', local.cookie))
    expect(
      new URL(response.headers.get('location')).searchParams.get('error'),
    ).toBe('GOOGLE_EMAIL_NOT_VERIFIED')
    profile.email_verified = true
    profile.email = 'different@example.test'
    response = await callback(await start('/link-social', local.cookie))
    expect(
      new URL(response.headers.get('location')).searchParams.get('error'),
    ).toBe('email_does_not_match')
    expect(store.account).toHaveLength(1)
  })
  it('requires a live recent session both at link start and callback', async () => {
    const local = await localUser()
    const flow = await start('/link-social', local.cookie)
    for (const item of store.session)
      item.createdAt = new Date(Date.now() - 301000)
    expect(
      (await request('/link-social', { provider: 'google' }, local.cookie))
        .status,
    ).toBe(403)
    const response = await callback(flow)
    expect(
      new URL(response.headers.get('location')).searchParams.get('error'),
    ).toBe('SESSION_NOT_FRESH')
    expect(store.account).toHaveLength(1)
  })
  it('rejects forged state, missing cookies, denied consent and frontend ID tokens', async () => {
    const flow = await start()
    const bad = await callback({ ...flow, state: 'forged' })
    expect(bad.status).toBe(302)
    expect(provider.validateAuthorizationCode).not.toHaveBeenCalled()
    const noCookie = await callback({ ...(await start()), cookie: undefined })
    expect(noCookie.status).toBe(302)
    expect(provider.validateAuthorizationCode).not.toHaveBeenCalled()
    const deniedFlow = await start()
    const denied = await request(
      '/callback/google?' +
        new URLSearchParams({
          state: deniedFlow.state,
          error: 'access_denied',
        }),
      undefined,
      deniedFlow.cookie,
    )
    expect(
      new URL(denied.headers.get('location')).searchParams.get('error'),
    ).toBe('access_denied')
    expect(
      (
        await request('/sign-in/social', {
          provider: 'google',
          idToken: { token: 'forged' },
        })
      ).status,
    ).toBeGreaterThanOrEqual(400)
  })
  it('rejects linking after logout and direct native unlink bypass', async () => {
    const local = await localUser()
    const flow = await start('/link-social', local.cookie)
    await request('/sign-out', {}, local.cookie)
    const response = await callback(flow)
    expect(response.status).toBe(302)
    expect(store.account).toHaveLength(1)
    expect(
      (
        await request(
          '/unlink-account',
          { accountId: store.account[0].id },
          local.cookie,
        )
      ).status,
    ).toBe(403)
  })
  it('rejects an account already linked to another user and a changed callback session', async () => {
    const original = await localUser(),
      other = await localUser('other-google@example.test')
    store.account.push({
      id: crypto.randomUUID(),
      userId: original.user.id,
      providerId: 'google',
      accountId: profile.sub,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    profile.email = other.user.email
    let response = await callback(await start('/link-social', other.cookie))
    expect(
      new URL(response.headers.get('location')).searchParams.get('error'),
    ).toBe('account_already_linked_to_different_user')
    profile.email = original.user.email
    const flow = await start('/link-social', original.cookie)
    response = await callback({
      ...flow,
      cookie: flow.cookie.replace(original.cookie, other.cookie),
    })
    expect(
      new URL(response.headers.get('location')).searchParams.get('error'),
    ).toBe('LINK_SESSION_CHANGED')
  })
  it('refuses a new unverified Google user and an unverified local linking session', async () => {
    profile.email_verified = false
    let response = await callback(await start())
    expect(
      new URL(response.headers.get('location')).searchParams.get('error'),
    ).toBe('GOOGLE_EMAIL_NOT_VERIFIED')
    expect(store.user).toHaveLength(0)
    const local = await localUser()
    store.user[0].emailVerified = false
    response = await request(
      '/link-social',
      { provider: 'google' },
      local.cookie,
    )
    expect(response.status).toBe(403)
  })
  it('reports missing configuration without inventing a provider', () => {
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '')
    expect(googleOptions()).toEqual({})
  })
})
