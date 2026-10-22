import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { user } from './auth.js'
import { categories, productVariants } from './catalog.js'
import { orders } from './commerce.js'
import { createdAt, money, updatedAt } from './shared.js'

export const loyaltyAccounts = pgTable('loyalty_account', {
  accountId: text('account_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  tier: varchar('tier', { length: 32 }).default('member').notNull(),
  pointsBalance: integer('points_balance').default(0).notNull(),
  lifetimePoints: integer('lifetime_points').default(0).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: updatedAt(),
}, (table) => [check('loyalty_account_points_check', sql`${table.pointsBalance} >= 0 and ${table.lifetimePoints} >= 0`)])

export const loyaltyTransactions = pgTable('loyalty_transaction', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').notNull().references(() => loyaltyAccounts.accountId, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 32 }).notNull(),
  points: integer('points').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  description: text('description'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [index('loyalty_transaction_account_date_idx').on(table.accountId, table.createdAt)])

export const notifications = pgTable('notification', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  channel: varchar('channel', { length: 32 }).default('in_app').notNull(),
  type: varchar('type', { length: 64 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  data: jsonb('data').default(sql`'{}'::jsonb`).notNull(),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [index('notification_account_status_date_idx').on(table.accountId, table.status, table.createdAt)])

export const productSubscriptions = pgTable('product_subscription', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').references(() => user.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(),
  targetPrice: money('target_price'),
  isActive: boolean('is_active').default(true).notNull(),
  lastNotifiedAt: timestamp('last_notified_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [
  index('product_subscription_variant_type_idx').on(table.variantId, table.type),
  check('product_subscription_contact_check', sql`${table.accountId} is not null or ${table.email} is not null`),
])

export const contentPages = pgTable('content_page', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 32 }).default('page').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  image: text('image'),
  status: varchar('status', { length: 32 }).default('draft').notNull(),
  authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const banners = pgTable('banner', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  placement: varchar('placement', { length: 64 }).notNull(),
  imageUrl: text('image_url').notNull(),
  mobileImageUrl: text('mobile_image_url'),
  linkUrl: text('link_url'),
  altText: varchar('alt_text', { length: 255 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('banner_placement_active_idx').on(table.placement, table.isActive)])

export const shippingZones = pgTable('shipping_zone', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  countryCode: varchar('country_code', { length: 2 }).default('VN').notNull(),
  provinces: jsonb('provinces').default(sql`'[]'::jsonb`).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const shippingRates = pgTable('shipping_rate', {
  id: uuid('id').defaultRandom().primaryKey(),
  zoneId: uuid('zone_id').notNull().references(() => shippingZones.id, { onDelete: 'cascade' }),
  carrier: varchar('carrier', { length: 64 }).notNull(),
  service: varchar('service', { length: 64 }).notNull(),
  minimumOrderValue: money('minimum_order_value').default('0').notNull(),
  maximumOrderValue: money('maximum_order_value'),
  minimumWeightGrams: integer('minimum_weight_grams').default(0).notNull(),
  maximumWeightGrams: integer('maximum_weight_grams'),
  price: money('price').notNull(),
  estimatedDaysMin: integer('estimated_days_min'),
  estimatedDaysMax: integer('estimated_days_max'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('shipping_rate_zone_active_idx').on(table.zoneId, table.isActive),
  check('shipping_rate_values_check', sql`${table.minimumOrderValue} >= 0 and ${table.minimumWeightGrams} >= 0 and ${table.price} >= 0`),
])

export const taxRates = pgTable('tax_rate', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  rate: money('rate').notNull(),
  countryCode: varchar('country_code', { length: 2 }).default('VN').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [check('tax_rate_value_check', sql`${table.rate} >= 0 and ${table.rate} <= 100`)])

export const auditLogs = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 128 }).notNull(),
  entityType: varchar('entity_type', { length: 128 }).notNull(),
  entityId: text('entity_id'),
  before: jsonb('before'),
  after: jsonb('after'),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  requestId: varchar('request_id', { length: 128 }),
  createdAt: createdAt(),
}, (table) => [
  index('audit_log_entity_date_idx').on(table.entityType, table.entityId, table.createdAt),
  index('audit_log_actor_date_idx').on(table.actorId, table.createdAt),
])

export const outboxEvents = pgTable('outbox_event', {
  id: uuid('id').defaultRandom().primaryKey(),
  topic: varchar('topic', { length: 128 }).notNull(),
  aggregateType: varchar('aggregate_type', { length: 128 }).notNull(),
  aggregateId: text('aggregate_id').notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  availableAt: timestamp('available_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  lastError: text('last_error'),
  createdAt: createdAt(),
}, (table) => [index('outbox_event_pending_idx').on(table.status, table.availableAt)])

export const idempotencyKeys = pgTable('idempotency_key', {
  key: varchar('key', { length: 128 }).primaryKey(),
  scope: varchar('scope', { length: 64 }).notNull(),
  requestHash: varchar('request_hash', { length: 128 }).notNull(),
  responseStatus: integer('response_status'),
  responseBody: jsonb('response_body'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: createdAt(),
}, (table) => [index('idempotency_key_expiry_idx').on(table.expiresAt)])

export const operationsSchema = {
  auditLogs,
  banners,
  contentPages,
  idempotencyKeys,
  loyaltyAccounts,
  loyaltyTransactions,
  notifications,
  outboxEvents,
  productSubscriptions,
  shippingRates,
  shippingZones,
  taxRates,
}
