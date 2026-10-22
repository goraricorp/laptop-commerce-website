import {twoFactor} from 'better-auth/plugins/two-factor'
import {assuranceBefore,assuranceAfter,sessionAssuranceBefore} from './assurance.js'
import {createAuthMiddleware} from 'better-auth/api'
import {
  googleOptions,
  googleAccountHook,
  validateGoogleIdentity,
} from './google.js'
import { dash } from '@better-auth/infra'
import { admin } from 'better-auth/plugins/admin'
import { adminAc, defaultAc, userAc } from 'better-auth/plugins/admin/access'
import { emailOTP } from 'better-auth/plugins/email-otp'
import { username } from 'better-auth/plugins/username'

import {
  sendPasswordResetEmail,
  sendVerificationOtpEmail,
} from '../email/mailer.js'
import {
  betterAuthApiKey,
  betterAuthSecret,
  betterAuthUrl,
  clientUrl,
} from '../utils/environment.js'

if (!betterAuthUrl || !clientUrl)
  throw new Error(
    'VITE_PUBLIC_SERVER_URL and VITE_PUBLIC_CLIENT_URL are required',
  )

export const authOptions = {
  basePath: '/auth',
  socialProviders: googleOptions(),
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
      requireLocalEmailVerified: true,
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
      trustedProviders: [],
    },
  },
  hooks: { before:createAuthMiddleware(async ctx=>{await assuranceBefore(ctx);await googleAccountHook(ctx)}),after:assuranceAfter },
  session:{cookieCache:{enabled:false},additionalFields:{secondFactorAt:{type:'date',required:false,input:false},reauthenticatedAt:{type:'date',required:false,input:false}}},
  databaseHooks:{session:{create:{before:sessionAssuranceBefore}}},
  onAPIError: { errorURL: new URL('/auth/error', clientUrl).href },
  baseURL: betterAuthUrl,
  secret: betterAuthSecret,
  trustedOrigins: [clientUrl],
  rateLimit: { enabled: true, storage: 'database' },
  advanced: {
    disableCSRFCheck: false,
    disableOriginCheck: false,
    // The separately deployed Vercel projects are cross-site. SameSite=None
    // allows browsers to attach the auth cookie to credentialed API requests.
    ...(process.env.NODE_ENV === 'production'
      ? { defaultCookieAttributes: { sameSite: 'none', secure: true } }
      : {}),
    database: {
      generateId: 'uuid',
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user: accountUser, url }) {
      await sendPasswordResetEmail({
        email: accountUser.email,
        name: accountUser.name,
        url,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  user: {
    validateUserInfo: validateGoogleIdentity,
    changeEmail: {
      enabled: true,
    },
    deleteUser: {enabled:false},
    additionalFields: {
      firstName: { type: 'string', required: false },
      lastName: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      birthday: { type: 'date', required: false },
    },
  },
  plugins: [
    twoFactor({issuer:"Laptop Commerce",allowPasswordless:true,backupCodeOptions:{storeBackupCodes:"encrypted"}}),
    username(),
    admin({
      defaultRole: 'user',
      adminRoles: ['administrator', 'master'],
      roles: {
        user: userAc,
        moderator: userAc,
        administrator: defaultAc.newRole({
          user: ['list', 'get'],
          session: ['list', 'revoke'],
        }),
        master: adminAc,
      },
    }),
    emailOTP({
      storeOTP: 'hashed',
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp }) {
        await sendVerificationOtpEmail({ email, otp })
      },
    }),
    ...(betterAuthApiKey ? [dash({ apiKey: betterAuthApiKey })] : []),
  ],
}
