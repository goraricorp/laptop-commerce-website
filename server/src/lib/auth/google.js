import {assertAssured} from './assurance.js'
import process from 'node:process'
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api'
export const REAUTH_SECONDS = 300
export function googleOptions() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim(),
    clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  return clientId && clientSecret
    ? {
        google: {
          clientId,
          clientSecret,
          disableIdTokenSignIn: true,
          prompt: 'select_account',
        },
      }
    : {}
}
export function assertRecentVerifiedSession(session) {
  if (!session?.session || !session.user)
    throw new APIError('UNAUTHORIZED', {
      code: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập.',
    })
  if (!session.user.emailVerified)
    throw new APIError('FORBIDDEN', {
      code: 'LOCAL_EMAIL_NOT_VERIFIED',
      message: 'Cần xác minh email tài khoản trước khi liên kết.',
    })
  const age = Date.now() - new Date(session.session.reauthenticatedAt??session.session.createdAt).getTime()
  if (!Number.isFinite(age) || age < 0 || age >= REAUTH_SECONDS * 1000)
    throw new APIError('FORBIDDEN', {
      code: 'SESSION_NOT_FRESH',
      message: 'Vui lòng đăng nhập lại để xác minh trước thao tác này.',
    })
  assertAssured(session,{fresh:true})
  return session
}
export const googleAccountHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path === '/unlink-account')
    throw new APIError('FORBIDDEN', {
      code: 'USE_ACCOUNT_SETTINGS',
      message:
        'Gỡ liên kết qua trang tài khoản để bảo vệ phương thức đăng nhập cuối cùng.',
    })
  if (ctx.path === '/link-social') {
    assertRecentVerifiedSession(
      await getSessionFromCtx(ctx, { disableCookieCache: true }),
    )
    if (ctx.body.provider !== 'google' || ctx.body.idToken)
      throw new APIError('BAD_REQUEST', {
        code: 'OAUTH_REDIRECT_REQUIRED',
        message: 'Sử dụng chuyển hướng Google để liên kết.',
      })
  }
})
export async function validateGoogleIdentity({ user, source }, ctx) {
  if (source.oauth?.providerId !== 'google') return
  if (user.emailVerified !== true)
    return {
      error: 'GOOGLE_EMAIL_NOT_VERIFIED',
      errorDescription: 'Google chưa xác minh email.',
    }
  if (source.action === 'link-account') {
    try {
      const current = assertRecentVerifiedSession(
        await getSessionFromCtx(ctx, { disableCookieCache: true }),
      )
      if (current.user.id !== user.id)
        return {
          error: 'LINK_SESSION_CHANGED',
          errorDescription: 'Phiên đăng nhập đã thay đổi. Vui lòng thử lại.',
        }
      if (current.user.email.toLowerCase() !== user.email?.toLowerCase())
        return {
          error: 'email_does_not_match',
          errorDescription:
            'Email tài khoản đã thay đổi; hãy bắt đầu lại liên kết.',
        }
    } catch (error) {
      return {
        error: error.body?.code ?? 'SESSION_NOT_FRESH',
        errorDescription: 'Cần đăng nhập lại trước khi liên kết.',
      }
    }
  }
}
