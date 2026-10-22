import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { user } from './auth.js'
import { brands, categories, products, productVariants } from './catalog.js'
import { inventoryLocations } from './core.js'
import { createdAt, metadata, money, updatedAt } from './shared.js'

export const promotions = pgTable('promotion', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 32 }).notNull(),
  value: money('value').default('0').notNull(),
  maximumDiscount: money('maximum_discount'),
  minimumOrderValue: money('minimum_order_value').default('0').notNull(),
  rules: jsonb('rules').default(sql`'{}'::jsonb`).notNull(),
  effects: jsonb('effects').default(sql`'{}'::jsonb`).notNull(),
  usageLimit: integer('usage_limit'),
  usageLimitPerUser: integer('usage_limit_per_user'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  priority: integer('priority').default(0).notNull(),
  isStackable: boolean('is_stackable').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('promotion_active_dates_idx').on(table.isActive, table.startsAt, table.endsAt),
  check('promotion_value_check', sql`${table.value} >= 0 and ${table.minimumOrderValue} >= 0`),
  check('promotion_dates_check', sql`${table.endsAt} is null or ${table.endsAt} >= ${table.startsAt}`),
])

export const promotionCodes = pgTable('promotion_code', {
  id: uuid('id').defaultRandom().primaryKey(),
  promotionId: uuid('promotion_id').notNull().references(() => promotions.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 64 }).notNull().unique(),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
}, (table) => [check('promotion_code_usage_check', sql`${table.usedCount} >= 0 and (${table.usageLimit} is null or ${table.usageLimit} >= ${table.usedCount})`)])

export const promotionScopes = pgTable('promotion_scope', {
  id: uuid('id').defaultRandom().primaryKey(),
  promotionId: uuid('promotion_id').notNull().references(() => promotions.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'cascade' }),
  isExcluded: boolean('is_excluded').default(false).notNull(),
}, (table) => [
  index('promotion_scope_promotion_idx').on(table.promotionId),
  check('promotion_scope_target_check', sql`num_nonnulls(${table.productId}, ${table.categoryId}, ${table.brandId}) = 1`),
])

export const carts = pgTable('cart', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').references(() => user.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 128 }).unique(),
  status: varchar('status', { length: 32 }).default('active').notNull(),
  currency: varchar('currency', { length: 3 }).default('VND').notNull(),
  locationId: uuid('location_id').references(() => inventoryLocations.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('cart_account_status_idx').on(table.accountId, table.status),
  uniqueIndex('cart_one_active_per_account_idx').on(table.accountId).where(sql`${table.status} = 'active' and ${table.accountId} is not null`),
  check('cart_owner_check', sql`${table.accountId} is not null or ${table.sessionToken} is not null`),
])

export const cartItems = pgTable('cart_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: money('unit_price'),
  selectedServices: jsonb('selected_services').default(sql`'[]'::jsonb`).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex('cart_item_cart_variant_idx').on(table.cartId, table.variantId),
  check('cart_item_quantity_check', sql`${table.quantity} > 0`),
])

export const wishlists = pgTable('wishlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 128 }).default('Yêu thích').notNull(),
  isDefault: boolean('is_default').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('wishlist_account_idx').on(table.accountId),
  uniqueIndex('wishlist_one_default_per_account_idx').on(table.accountId).where(sql`${table.isDefault} = true`),
])

export const wishlistItems = pgTable('wishlist_item', {
  wishlistId: uuid('wishlist_id').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (table) => [primaryKey({ columns: [table.wishlistId, table.productId] })])

export const compareLists = pgTable('compare_list', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').references(() => user.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 128 }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const compareItems = pgTable('compare_item', {
  compareListId: uuid('compare_list_id').notNull().references(() => compareLists.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (table) => [primaryKey({ columns: [table.compareListId, table.productId] })])

export const productViews = pgTable('product_view', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').references(() => user.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 128 }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('product_view_account_date_idx').on(table.accountId, table.viewedAt)])

export const pcBuilds = pgTable('pc_build', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  sessionToken: varchar('session_token', { length: 128 }),
  name: varchar('name', { length: 255 }).default('Cấu hình PC').notNull(),
  purpose: varchar('purpose', { length: 64 }),
  budget: money('budget'),
  status: varchar('status', { length: 32 }).default('draft').notNull(),
  compatibilityStatus: varchar('compatibility_status', { length: 32 }).default('unchecked').notNull(),
  compatibilityResult: jsonb('compatibility_result').default(sql`'{}'::jsonb`).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [check('pc_build_owner_check', sql`${table.accountId} is not null or ${table.sessionToken} is not null`)])

export const pcBuildItems = pgTable('pc_build_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  buildId: uuid('build_id').notNull().references(() => pcBuilds.id, { onDelete: 'cascade' }),
  slotType: varchar('slot_type', { length: 32 }).notNull(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').default(1).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex('pc_build_item_build_slot_variant_idx').on(table.buildId, table.slotType, table.variantId),
  check('pc_build_item_quantity_check', sql`${table.quantity} > 0`),
])

export const orders = pgTable('sales_order', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 64 }).notNull().unique(),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  channel: varchar('channel', { length: 32 }).default('web').notNull(),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  paymentStatus: varchar('payment_status', { length: 32 }).default('unpaid').notNull(),
  fulfillmentStatus: varchar('fulfillment_status', { length: 32 }).default('unfulfilled').notNull(),
  currency: varchar('currency', { length: 3 }).default('VND').notNull(),
  subtotal: money('subtotal').default('0').notNull(),
  discountTotal: money('discount_total').default('0').notNull(),
  shippingTotal: money('shipping_total').default('0').notNull(),
  taxTotal: money('tax_total').default('0').notNull(),
  grandTotal: money('grand_total').default('0').notNull(),
  promotionCode: varchar('promotion_code', { length: 64 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 32 }).notNull(),
  customerNote: text('customer_note'),
  internalNote: text('internal_note'),
  sourceLocationId: uuid('source_location_id').references(() => inventoryLocations.id, { onDelete: 'set null' }),
  pickupLocationId: uuid('pickup_location_id').references(() => inventoryLocations.id, { onDelete: 'set null' }),
  placedAt: timestamp('placed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('sales_order_account_date_idx').on(table.accountId, table.createdAt),
  index('sales_order_status_date_idx').on(table.status, table.createdAt),
  check('sales_order_totals_check', sql`${table.subtotal} >= 0 and ${table.discountTotal} >= 0 and ${table.shippingTotal} >= 0 and ${table.taxTotal} >= 0 and ${table.grandTotal} >= 0`),
])

export const orderAddresses = pgTable('order_address', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 16 }).notNull(),
  recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  recipientPhone: varchar('recipient_phone', { length: 32 }).notNull(),
  line1: varchar('line_1', { length: 255 }).notNull(),
  line2: varchar('line_2', { length: 255 }),
  ward: varchar('ward', { length: 128 }),
  district: varchar('district', { length: 128 }).notNull(),
  province: varchar('province', { length: 128 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }),
  countryCode: varchar('country_code', { length: 2 }).default('VN').notNull(),
}, (table) => [uniqueIndex('order_address_order_type_idx').on(table.orderId, table.type)])

export const orderItems = pgTable('sales_order_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  sku: varchar('sku', { length: 64 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  variantName: varchar('variant_name', { length: 255 }),
  productSnapshot: jsonb('product_snapshot').default(sql`'{}'::jsonb`).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: money('unit_price').notNull(),
  discountTotal: money('discount_total').default('0').notNull(),
  taxTotal: money('tax_total').default('0').notNull(),
  lineTotal: money('line_total').notNull(),
  warrantyMonths: integer('warranty_months').default(0).notNull(),
}, (table) => [
  index('sales_order_item_order_idx').on(table.orderId),
  check('sales_order_item_quantity_check', sql`${table.quantity} > 0`),
  check('sales_order_item_totals_check', sql`${table.unitPrice} >= 0 and ${table.discountTotal} >= 0 and ${table.taxTotal} >= 0 and ${table.lineTotal} >= 0`),
])

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: varchar('from_status', { length: 32 }),
  toStatus: varchar('to_status', { length: 32 }).notNull(),
  note: text('note'),
  changedBy: text('changed_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (table) => [index('order_status_history_order_date_idx').on(table.orderId, table.createdAt)])

export const promotionUsages = pgTable('promotion_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  promotionId: uuid('promotion_id').notNull().references(() => promotions.id, { onDelete: 'restrict' }),
  promotionCodeId: uuid('promotion_code_id').references(() => promotionCodes.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  discountAmount: money('discount_amount').notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex('promotion_usage_promotion_order_idx').on(table.promotionId, table.orderId),
  index('promotion_usage_account_idx').on(table.accountId, table.promotionId),
])

export const payments = pgTable('payment', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  provider: varchar('provider', { length: 32 }).notNull(),
  method: varchar('method', { length: 32 }).notNull(),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  amount: money('amount').notNull(),
  currency: varchar('currency', { length: 3 }).default('VND').notNull(),
  providerReference: varchar('provider_reference', { length: 255 }),
  idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull().unique(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: metadata(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('payment_order_status_idx').on(table.orderId, table.status),
  check('payment_amount_check', sql`${table.amount} >= 0`),
])

export const paymentTransactions = pgTable('payment_transaction', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  amount: money('amount').notNull(),
  providerTransactionId: varchar('provider_transaction_id', { length: 255 }),
  requestPayload: jsonb('request_payload'),
  responsePayload: jsonb('response_payload'),
  failureCode: varchar('failure_code', { length: 128 }),
  failureMessage: text('failure_message'),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('payment_transaction_payment_date_idx').on(table.paymentId, table.processedAt)])

export const refunds = pgTable('refund', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'restrict' }),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  amount: money('amount').notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  providerReference: varchar('provider_reference', { length: 255 }),
  requestedBy: text('requested_by').references(() => user.id, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [check('refund_amount_check', sql`${table.amount} > 0`)])

export const shipments = pgTable('shipment', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  locationId: uuid('location_id').references(() => inventoryLocations.id, { onDelete: 'set null' }),
  carrier: varchar('carrier', { length: 64 }),
  service: varchar('service', { length: 64 }),
  trackingNumber: varchar('tracking_number', { length: 128 }),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  shippingFee: money('shipping_fee').default('0').notNull(),
  estimatedDeliveryAt: timestamp('estimated_delivery_at', { withTimezone: true }),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  metadata: metadata(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('shipment_order_idx').on(table.orderId),
  index('shipment_tracking_idx').on(table.trackingNumber),
])

export const shipmentItems = pgTable('shipment_item', {
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
}, (table) => [
  primaryKey({ columns: [table.shipmentId, table.orderItemId] }),
  check('shipment_item_quantity_check', sql`${table.quantity} > 0`),
])

export const shipmentEvents = pgTable('shipment_event', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 64 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  rawPayload: jsonb('raw_payload'),
}, (table) => [index('shipment_event_shipment_date_idx').on(table.shipmentId, table.occurredAt)])

export const invoices = pgTable('invoice', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().unique().references(() => orders.id, { onDelete: 'restrict' }),
  number: varchar('number', { length: 64 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }),
  taxCode: varchar('tax_code', { length: 64 }),
  billingAddress: text('billing_address'),
  email: varchar('email', { length: 255 }),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  fileUrl: text('file_url'),
  metadata: metadata(),
  createdAt: createdAt(),
})

export const productReviews = pgTable('product_review', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  orderItemId: uuid('order_item_id').references(() => orderItems.id, { onDelete: 'set null' }),
  score: integer('score').notNull(),
  title: varchar('title', { length: 255 }),
  comment: text('comment'),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
  helpfulCount: integer('helpful_count').default(0).notNull(),
  merchantReply: text('merchant_reply'),
  merchantRepliedAt: timestamp('merchant_replied_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex('product_review_account_product_idx').on(table.accountId, table.productId),
  index('product_review_product_status_date_idx').on(table.productId, table.status, table.createdAt),
  check('product_review_score_check', sql`${table.score} between 1 and 5`),
  check('product_review_helpful_check', sql`${table.helpfulCount} >= 0`),
])

export const reviewMedia = pgTable('review_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  reviewId: uuid('review_id').notNull().references(() => productReviews.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 16 }).default('image').notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
})

export const reviewVotes = pgTable('review_vote', {
  reviewId: uuid('review_id').notNull().references(() => productReviews.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  isHelpful: boolean('is_helpful').notNull(),
  createdAt: createdAt(),
}, (table) => [primaryKey({ columns: [table.reviewId, table.accountId] })])

export const commerceSchema = {
  cartItems,
  carts,
  compareItems,
  compareLists,
  invoices,
  orderAddresses,
  orderItems,
  orderStatusHistory,
  orders,
  paymentTransactions,
  payments,
  pcBuildItems,
  pcBuilds,
  productReviews,
  productViews,
  promotionCodes,
  promotionScopes,
  promotionUsages,
  promotions,
  refunds,
  reviewMedia,
  reviewVotes,
  shipmentEvents,
  shipmentItems,
  shipments,
  wishlistItems,
  wishlists,
}
