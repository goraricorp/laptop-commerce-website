import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { databaseUrl } from '../lib/utils/environment.js'
import { authRelations, schema } from './schema.js'

if (!databaseUrl) throw new Error('DATABASE_URL is required')

export const pool = new Pool({ connectionString: databaseUrl, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000, allowExitOnIdle: true })
export const db = drizzle({ client: pool, relations: { ...defineRelations(schema), ...authRelations } })
