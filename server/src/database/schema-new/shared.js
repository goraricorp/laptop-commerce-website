import { sql } from 'drizzle-orm'
import { jsonb, numeric, timestamp } from 'drizzle-orm/pg-core'

export const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
export const updatedAt = () => timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
export const money = (name) => numeric(name, { precision: 16, scale: 2 })
export const metadata = () => jsonb('metadata').default(sql`'{}'::jsonb`).notNull()
