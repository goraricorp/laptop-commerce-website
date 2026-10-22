import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { betterAuth } from 'better-auth'

import { db } from '../../database/index.js'
import { authSchema } from '../../database/schema.js'
import { authOptions } from './options.js'

export const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
})
