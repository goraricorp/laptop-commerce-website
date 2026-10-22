import { and, eq } from 'drizzle-orm'
import { APIError } from 'better-auth/api'
import { z } from 'zod'
import { db } from '../database/index.js'
import { user, account } from '../database/auth-schema.js'
import {
  assertRecentVerifiedSession,
  googleOptions,
} from '../lib/auth/google.js'
export async function unlinkConnectedAccount(session, raw) {
  assertRecentVerifiedSession(session)
  const { accountId } = z.object({ accountId: z.uuid() }).strict().parse(raw)
  return db.transaction(async (tx) => {
    // Serialize all unlinks for an owner: two concurrent requests cannot remove both methods.
    const [owner] = await tx
      .select({ id: user.id, emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.id, session.user.id))
      .for('update')
    if (!owner?.emailVerified)
      throw new APIError('FORBIDDEN', {
        code: 'LOCAL_EMAIL_NOT_VERIFIED',
        message: 'Cần xác minh email.',
      })
    const accounts = await tx
      .select({
        id: account.id,
        providerId: account.providerId,
        accountId: account.accountId,
        password: account.password,
      })
      .from(account)
      .where(eq(account.userId, owner.id))
    if (!accounts.some((item) => item.id === accountId))
      throw new APIError('NOT_FOUND', {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Không tìm thấy liên kết thuộc tài khoản của bạn.',
      })
    const remaining = accounts.filter((item) => item.id !== accountId)
    const usable = remaining.some((item) =>
      item.providerId === 'credential'
        ? Boolean(item.password) && item.accountId === owner.id
        : item.providerId === 'google' &&
          Boolean(item.accountId?.trim()) &&
          Boolean(googleOptions().google),
    )
    if (!usable)
      throw new APIError('CONFLICT', {
        code: 'FAILED_TO_UNLINK_LAST_ACCOUNT',
        message: 'Cần giữ ít nhất một phương thức đăng nhập đang sử dụng được.',
      })
    await tx
      .delete(account)
      .where(and(eq(account.id, accountId), eq(account.userId, owner.id)))
    return { status: true }
  })
}
