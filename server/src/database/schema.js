import { sql } from 'drizzle-orm'
import {
  bigint, boolean, check, foreignKey, index, integer, jsonb, numeric, pgEnum, pgTable, primaryKey,
  text, timestamp, uniqueIndex, uuid, varchar,
} from 'drizzle-orm/pg-core'

import { authSchema, user } from './auth-schema.js'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export { twoFactor, account, authRelations, authSchema, rateLimit, session, user, userRoleEnum, verification } from './auth-schema.js'
export const addressTypeEnum = pgEnum('address_type', ['home', 'office', 'other'])
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'inactive', 'archived'])
export const productTypeEnum = pgEnum('product_type', [
  'laptop',
  'monitor',
  'component', // RAM, SSD, HDD...
  'accessory', // bàn phím, chuột, sạc, arm, hub, balo, loa...
  'furniture', // ghế công thái học, bàn nâng hạ
  'gaming', // máy chơi game, console, VR
  'other',
])
export const variantStatusEnum = pgEnum('variant_status', ['active', 'inactive', 'out_of_stock', 'discontinued'])
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video'])
export const attributeDisplayTypeEnum = pgEnum('attribute_display_type', ['text', 'color', 'number', 'boolean', 'select'])
export const inventoryLocationTypeEnum = pgEnum('inventory_location_type', ['store', 'warehouse', 'service_center'])
export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'reservation', 'release', 'return'])
export const cartStatusEnum = pgEnum('cart_status', ['active', 'converted', 'abandoned'])
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed'])
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'returned'])
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'])
export const fulfillmentStatusEnum = pgEnum('fulfillment_status', ['unfulfilled', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'])
export const orderAddressTypeEnum = pgEnum('order_address_type', ['shipping', 'billing'])
export const paymentProviderEnum = pgEnum('payment_provider', ['momo', 'zalopay', 'vnpay', 'paypal', 'stripe', 'cod', 'bank_transfer', 'other'])
export const paymentMethodEnum = pgEnum('payment_method', ['online', 'cod', 'card', 'bank_transfer', 'wallet'])
export const paymentRecordStatusEnum = pgEnum('payment_record_status', ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])
export const shipmentStatusEnum = pgEnum('shipment_status', ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'])
export const reviewStatusEnum = pgEnum('review_status', ['pending', 'published', 'rejected', 'hidden'])
export const conversationTypeEnum = pgEnum('conversation_type', ['buyer-seller', 'buyer-chatbot', 'support'])
export const conversationStatusEnum = pgEnum('conversation_status', ['open', 'pending', 'resolved', 'closed'])
export const actorTypeEnum = pgEnum('actor_type', ['user', 'guest', 'moderator', 'administrator', 'chatbot', 'system'])
export const senderTypeEnum = pgEnum('sender_type', ['user', 'guest', 'moderator', 'administrator', 'chatbot', 'system'])

export const addresses = pgTable('address', {
  id: uuid('id').defaultRandom().primaryKey(), userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  recipientName: varchar('recipient_name', { length: 255 }).notNull(), phone: varchar('phone', { length: 20 }).notNull(),
  type: addressTypeEnum('type').default('home').notNull(), addressLine: text('address_line').notNull(),
  ward: varchar('ward', { length: 255 }), district: varchar('district', { length: 255 }).notNull(),
  province: varchar('province', { length: 255 }).notNull(), country: varchar('country', { length: 100 }).default('Việt Nam').notNull(),
  isDefault: boolean('is_default').default(false).notNull(), ...timestamps,
}, (table) => [index('address_user_idx').on(table.userId)])

export const categories = pgTable('category', {
  id: uuid('id').defaultRandom().primaryKey(), parentId: uuid('parent_id'), name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(), description: text('description'), imageUrl: text('image_url'),
  position: integer('position').default(0).notNull(), isActive: boolean('is_active').default(true).notNull(), ...timestamps,
}, (table) => [
  foreignKey({ columns: [table.parentId], foreignColumns: [table.id], name: 'category_parent_id_fk' }).onDelete('set null'),
  index('category_parent_idx').on(table.parentId),
])

export const brands = pgTable('brand', {
  id: uuid('id').defaultRandom().primaryKey(), name: varchar('name', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 255 }).notNull().unique(), logoUrl: text('logo_url'),
  isActive: boolean('is_active').default(true).notNull(), ...timestamps,
})

export const products = pgTable('product', {
  id: uuid('id').defaultRandom().primaryKey(), categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  version:integer('version').default(0).notNull(),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }), name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(), summary: text('summary'),
  status: productStatusEnum('status').default('active').notNull(), // productType: productTypeEnum('product_type').default('other').notNull(),
  ...timestamps,
}, (table) => [index('product_category_idx').on(table.categoryId), index('product_brand_idx').on(table.brandId), index('product_status_idx').on(table.status)])

export const productVariants = pgTable('product_variant', {
  id: uuid('id').defaultRandom().primaryKey(), productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }).notNull().unique(), name: varchar('name', { length: 255 }).notNull(),
  barcode: varchar('barcode', { length: 100 }).unique(), price: numeric('price', { precision: 14, scale: 2 }).notNull(),
  compareAtPrice: numeric('compare_at_price', { precision: 14, scale: 2 }), costPrice: numeric('cost_price', { precision: 14, scale: 2 }),
  status: variantStatusEnum('status').default('active').notNull(), weightGrams: integer('weight_grams'), ...timestamps,
}, (table) => [index('product_variant_product_idx').on(table.productId), index('variant_active_price_idx').on(table.status, table.price, table.productId, table.id)])

export const productMedia = pgTable('product_media', {
  id: uuid('id').defaultRandom().primaryKey(), productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }), url: text('url').notNull(),
  mediaType: mediaTypeEnum('media_type').default('image').notNull(), alt: varchar('alt', { length: 255 }),
  position: integer('position').default(0).notNull(), isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('product_media_product_idx').on(table.productId), index('product_media_variant_idx').on(table.variantId)])

export const productContentSections = pgTable('product_content_section', {
  id: uuid('id').defaultRandom().primaryKey(), productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 10 }).default('plain').notNull(), title: varchar('title', { length: 255 }), content: text('content'), imageUrl: text('image_url'), position: integer('position').default(0).notNull(),
}, (table) => [index('product_content_product_idx').on(table.productId), index('product_content_order_idx').on(table.productId, table.position, table.id), check('product_content_format', sql`${table.format} in ('plain','html')`)])

export const attributes = pgTable('attribute', {
  id: uuid('id').defaultRandom().primaryKey(), name: varchar('name', { length: 100 }).notNull().unique(),
  code: varchar('code', { length: 100 }).notNull().unique(), displayType: attributeDisplayTypeEnum('display_type').default('text').notNull(),
  isFilterable: boolean('is_filterable').default(true).notNull(), position: integer('position').default(0).notNull(),
})

export const attributeValues = pgTable('attribute_value', {
  id: uuid('id').defaultRandom().primaryKey(), attributeId: uuid('attribute_id').notNull().references(() => attributes.id, { onDelete: 'cascade' }),
  value: varchar('value', { length: 255 }).notNull(), code: varchar('code', { length: 100 }), metadata: jsonb('metadata').default({}).notNull(),
  position: integer('position').default(0).notNull(),
}, (table) => [uniqueIndex('attribute_value_unique_idx').on(table.attributeId, table.value), index('attribute_value_attribute_idx').on(table.attributeId)])

export const variantAttributeValues = pgTable('variant_attribute_value', {
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  attributeValueId: uuid('attribute_value_id').notNull().references(() => attributeValues.id, { onDelete: 'cascade' }),
}, (table) => [primaryKey({ columns: [table.variantId, table.attributeValueId] }), index('variant_attribute_value_value_idx').on(table.attributeValueId)])

export const inventoryLocations = pgTable('inventory_location', {
  id: uuid('id').defaultRandom().primaryKey(), code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(), type: inventoryLocationTypeEnum('type').default('store').notNull(),
  address: text('address'), phone: varchar('phone', { length: 20 }), isActive: boolean('is_active').default(true).notNull(), ...timestamps,
})

export const inventoryBalances = pgTable('inventory_balance', {
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  quantityOnHand: integer('quantity_on_hand').default(0).notNull(), quantityReserved: integer('quantity_reserved').default(0).notNull(),
  reorderLevel: integer('reorder_level').default(0).notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.locationId, table.variantId] }), index('inventory_balance_variant_idx').on(table.variantId),
check('inventory_balance_non_negative', sql`${table.quantityOnHand} >= 0 AND ${table.quantityReserved} >= 0 AND ${table.quantityReserved} <= ${table.quantityOnHand}`)])

export const inventoryOperations = pgTable('inventory_operation', {
  id: uuid('id').defaultRandom().primaryKey(), key: varchar('key', { length: 180 }).notNull().unique(),
  requestHash: text('request_hash').notNull(), kind: varchar('kind', { length: 40 }).notNull(),
  actorId: uuid('actor_id').references(() => user.id, { onDelete: 'set null' }),
  referenceId: uuid('reference_id'), result: jsonb('result'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
export const inventoryBaselines = pgTable('inventory_baseline', {
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  quantityOnHand: integer('quantity_on_hand').notNull(), quantityReserved: integer('quantity_reserved').notNull(),
  lastMovementIndex: bigint('last_movement_index', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.locationId, table.variantId] })])
export const inventoryReservations = pgTable('inventory_reservation', {
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(), state: varchar('state', { length: 20 }).notNull().default('reserved'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.orderId, table.locationId, table.variantId] }), check('inventory_reservation_valid', sql`${table.quantity} > 0 AND ${table.state} IN ('reserved', 'released', 'issued')`)])

export const stockMovements = pgTable('stock_movement', {
  id: uuid('id').defaultRandom().primaryKey(),
  ledgerIndex: bigint('ledger_index', { mode: 'number' }).generatedByDefaultAsIdentity().notNull(),
  operationId: uuid('operation_id').references(() => inventoryOperations.id, { onDelete: 'restrict' }),
  actorId: uuid('actor_id').references(() => user.id, { onDelete: 'set null' }),
  onHandDelta: integer('on_hand_delta'), reservedDelta: integer('reserved_delta'),
  onHandBefore: integer('on_hand_before'), onHandAfter: integer('on_hand_after'), reservedBefore: integer('reserved_before'), reservedAfter: integer('reserved_after'),
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }), type: stockMovementTypeEnum('type').default('adjustment').notNull(),
  quantity: integer('quantity').notNull(), referenceType: varchar('reference_type', { length: 50 }), referenceId: uuid('reference_id'),
  note: text('note'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('stock_movement_location_variant_idx').on(table.locationId, table.variantId), check('stock_movement_quantity_non_zero', sql`${table.quantity} <> 0`)])

export const carts = pgTable('cart', {
  id: uuid('id').defaultRandom().primaryKey(), userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  guestToken: uuid('guest_token').defaultRandom().unique(), status: cartStatusEnum('status').default('active').notNull(), ...timestamps,
}, (table) => [index('cart_user_idx').on(table.userId)])

export const cartItems = pgTable('cart_item', {
  id: uuid('id').defaultRandom().primaryKey(), cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }), quantity: integer('quantity').default(1).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(), ...timestamps,
}, (table) => [uniqueIndex('cart_item_cart_variant_idx').on(table.cartId, table.variantId), check('cart_item_quantity_positive', sql`${table.quantity} > 0`)])

export const promotions = pgTable('promotion', {
  id: uuid('id').defaultRandom().primaryKey(), name: varchar('name', { length: 255 }).notNull(), discountType: discountTypeEnum('discount_type').default('fixed').notNull(),
  discountValue: numeric('discount_value', { precision: 14, scale: 2 }).notNull(), minimumOrderValue: numeric('minimum_order_value', { precision: 14, scale: 2 }).default('0').notNull(),
  maximumDiscount: numeric('maximum_discount', { precision: 14, scale: 2 }), startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(), isActive: boolean('is_active').default(true).notNull(), ...timestamps,
}, (table) => [check('promotion_date_range', sql`${table.endsAt} > ${table.startsAt}`)])

export const campaigns = pgTable('storefront_campaign', {
  id: uuid('id').defaultRandom().primaryKey(), title: varchar('title', { length: 255 }).notNull(),
  description: text('description'), imageUrl: text('image_url').notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }),
  promotionId: uuid('promotion_id').references(() => promotions.id, { onDelete: 'restrict' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(), endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true).notNull(), position: integer('position').default(0).notNull(), ...timestamps,
}, table => [check('campaign_dates', sql`${table.endsAt} > ${table.startsAt}`), index('campaign_active_dates_idx').on(table.isActive, table.startsAt, table.endsAt)])

export const promotionCodes = pgTable('promotion_code', {
  id: uuid('id').defaultRandom().primaryKey(), promotionId: uuid('promotion_id').notNull().references(() => promotions.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 64 }).notNull().unique(), usageLimit: integer('usage_limit'), usagePerUser: integer('usage_per_user').default(1).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
}, (table) => [index('promotion_code_promotion_idx').on(table.promotionId)])

export const orders = pgTable('sales_order', {
  id: uuid('id').defaultRandom().primaryKey(), code: varchar('code', { length: 50 }).notNull().unique(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }), guestEmail: varchar('guest_email', { length: 255 }),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(), discountTotal: numeric('discount_total', { precision: 14, scale: 2 }).default('0').notNull(),
  shippingTotal: numeric('shipping_total', { precision: 14, scale: 2 }).default('0').notNull(), grandTotal: numeric('grand_total', { precision: 14, scale: 2 }).notNull(),
  orderStatus: orderStatusEnum('order_status').default('pending').notNull(), paymentStatus: paymentStatusEnum('payment_status').default('unpaid').notNull(),
  fulfillmentStatus: fulfillmentStatusEnum('fulfillment_status').default('unfulfilled').notNull(), note: text('note'), ...timestamps,
}, (table) => [index('sales_order_user_idx').on(table.userId), index('sales_order_owner_cursor_idx').on(table.userId,table.createdAt,table.id), index('sales_order_cursor_idx').on(table.createdAt,table.id), index('sales_order_created_idx').on(table.createdAt), index('sales_order_spotlight_idx').on(table.orderStatus, table.paymentStatus, table.updatedAt)])

export const orderAddresses = pgTable('order_address', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  type: orderAddressTypeEnum('type').default('shipping').notNull(), recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(), addressLine: text('address_line').notNull(), ward: varchar('ward', { length: 255 }),
  district: varchar('district', { length: 255 }).notNull(), province: varchar('province', { length: 255 }).notNull(),
  country: varchar('country', { length: 100 }).default('Việt Nam').notNull(),
}, (table) => [index('order_address_order_idx').on(table.orderId)])

export const orderItems = pgTable('sales_order_item', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }), sku: varchar('sku', { length: 100 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(), variantName: varchar('variant_name', { length: 255 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(), quantity: integer('quantity').notNull(), total: numeric('total', { precision: 14, scale: 2 }).notNull(),
}, (table) => [index('sales_order_item_order_idx').on(table.orderId), check('sales_order_item_quantity_positive', sql`${table.quantity} > 0`)])

export const promotionUsages = pgTable('promotion_usage', {
  id: uuid('id').defaultRandom().primaryKey(), promotionCodeId: uuid('promotion_code_id').notNull().references(() => promotionCodes.id, { onDelete: 'restrict' }),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }), orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  usedAt: timestamp('used_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('promotion_usage_user_idx').on(table.userId)])

export const payments = pgTable('payment', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  provider: paymentProviderEnum('provider').default('other').notNull(), method: paymentMethodEnum('method').default('online').notNull(), transactionId: varchar('transaction_id', { length: 255 }).unique(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(), status: paymentRecordStatusEnum('status').default('pending').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }), metadata: jsonb('metadata').default({}).notNull(), ...timestamps,
}, (table) => [index('payment_order_idx').on(table.orderId)])

export const checkoutSessions = pgTable('checkout_session', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  requestKey: uuid('request_key').notNull(), fingerprint: text('fingerprint').notNull(),
  orderId: uuid('order_id').notNull().unique().references(() => orders.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).notNull(), providerOrderId: text('provider_order_id').unique(),
  providerAmount: numeric('provider_amount', { precision: 14, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(), exchangeRate: numeric('exchange_rate', { precision: 14, scale: 4 }),
  state: varchar('state', { length: 30 }).default('created').notNull(), paymentUrl: text('payment_url'),
  reservations: jsonb('reservations').default([]).notNull(),
  cartSnapshot: jsonb('cart_snapshot').default([]).notNull(),
  cartClearedAt: timestamp('cart_cleared_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), ...timestamps,
}, table => [uniqueIndex('checkout_session_user_request_idx').on(table.userId, table.requestKey), index('checkout_session_state_expiry_idx').on(table.state, table.expiresAt)])

export const shipments = pgTable('shipment', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  carrier: varchar('carrier', { length: 100 }), trackingNumber: varchar('tracking_number', { length: 255 }).unique(),
  status: shipmentStatusEnum('status').default('pending').notNull(), shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }), ...timestamps,
}, (table) => [index('shipment_order_idx').on(table.orderId)])

export const orderStatusHistories = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: orderStatusEnum('status').default('pending').notNull(), note: text('note'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('order_status_history_order_idx').on(table.orderId)])

export const productReviews = pgTable('product_review', {
  id: uuid('id').defaultRandom().primaryKey(), userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }), orderItemId: uuid('order_item_id').references(() => orderItems.id, { onDelete: 'set null' }),
  guestName: varchar('guest_name', { length: 255 }), title: varchar('title', { length: 255 }), score: integer('score').notNull(),
  comment: text('comment'), status: reviewStatusEnum('status').default('published').notNull(), isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(), ...timestamps,
}, (table) => [uniqueIndex('product_review_user_product_unique').on(table.userId, table.productId), index('product_review_product_idx').on(table.productId), check('product_review_score_range', sql`${table.score} BETWEEN 1 AND 5`)])

export const conversations = pgTable('conversation', {
  id: uuid('id').defaultRandom().primaryKey(), type: conversationTypeEnum('type').default('support').notNull(),
  ownerId:uuid('owner_id').references(()=>user.id), assignedToId:uuid('assigned_to_id').references(()=>user.id),
  status: conversationStatusEnum('status').default('open').notNull(), subject: varchar('subject', { length: 255 }), ...timestamps,
},table=>[index('conversation_owner_updated_idx').on(table.ownerId,table.updatedAt,table.id),index('conversation_assignee_updated_idx').on(table.assignedToId,table.updatedAt,table.id)])

export const conversationParticipants = pgTable('conversation_participant', {
  id: uuid('id').defaultRandom().primaryKey(), conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }), actorType: actorTypeEnum('actor_type').default('guest').notNull(),
  displayName: varchar('display_name', { length: 255 }), joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('conversation_participant_conversation_idx').on(table.conversationId)])

export const messages = pgTable('message', {
  id: uuid('id').defaultRandom().primaryKey(), conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderUserId: uuid('sender_user_id').references(() => user.id, { onDelete: 'set null' }), senderType: senderTypeEnum('sender_type').default('system').notNull(),
  content: text('content').notNull(), metadata: jsonb('metadata').default({}).notNull(), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('message_conversation_created_idx').on(table.conversationId, table.createdAt)])

export const messageAttachments = pgTable('message_attachment', {
  id: uuid('id').defaultRandom().primaryKey(), messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  url: text('url').notNull(), mimeType: varchar('mime_type', { length: 100 }).notNull(), fileName: varchar('file_name', { length: 255 }), sizeBytes: integer('size_bytes'),
}, (table) => [index('message_attachment_message_idx').on(table.messageId)])

export const uploadAssets = pgTable('upload_asset', {
  key: text('key').primaryKey(), url: text('url').notNull().unique(),
  userId: uuid('user_id').notNull(),
  state: varchar('state', { length: 20 }).default('pending').notNull(),
  purpose:varchar('purpose',{length:20}).default('general').notNull(),
  checkedAt: timestamp('checked_at', {withTimezone:true}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Phase 4: immutable business events and durable work; no provider call runs in a transaction.
export const fulfillmentCommands = pgTable('fulfillment_command', {
  id: uuid('id').primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id),
  actorId: uuid('actor_id').notNull().references(() => user.id), hash: text('hash').notNull(), result: jsonb('result'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
export const orderFulfillments = pgTable('order_fulfillment', {
  orderId: uuid('order_id').primaryKey().references(() => orders.id),
  stockIssuedAt: timestamp('stock_issued_at', { withTimezone: true }), deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  provenance: text('provenance').default('command').notNull(), ...timestamps,
})
export const shipmentEvents = pgTable('shipment_event', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id),
  shipmentId: uuid('shipment_id').references(() => shipments.id), actorId: uuid('actor_id').references(() => user.id),
  commandId: uuid('command_id').notNull().unique().references(() => fulfillmentCommands.id),
  type: text('type').notNull(), note: text('note').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
export const orderAllocations = pgTable('order_allocation', {
  orderItemId: uuid('order_item_id').primaryKey().references(() => orderItems.id), orderId: uuid('order_id').notNull().references(() => orders.id),
  quantity: integer('quantity').notNull(), gross: bigint('gross', { mode: 'number' }).notNull(),
  discount: bigint('discount', { mode: 'number' }).notNull(), net: bigint('net', { mode: 'number' }).notNull(),
})
export const returns = pgTable('sales_return', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id),
  userId: uuid('user_id').references(() => user.id), status: text('status').default('requested').notNull(),
  reason: text('reason').notNull(), ...timestamps,
}, t => [index('sales_return_order_idx').on(t.orderId), check('sales_return_status_check', sql`${t.status} in ('requested','approved','rejected','received','inspected','completed')`)])
export const returnItems = pgTable('sales_return_item', {
  id: uuid('id').defaultRandom().primaryKey(), returnId: uuid('return_id').notNull().references(() => returns.id),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id), units: jsonb('units').notNull(), quantity: integer('quantity').notNull(),
  acceptedQuantity: integer('accepted_quantity'), restockQuantity: integer('restock_quantity'), locationId: uuid('location_id').references(() => inventoryLocations.id),
  condition: text('condition'), note: text('note'), refundAmount: bigint('refund_amount', { mode: 'number' }).default(0).notNull(),
}, t => [uniqueIndex('sales_return_item_unique').on(t.returnId,t.orderItemId), check('sales_return_item_quantities', sql`${t.quantity}>0 and (${t.acceptedQuantity} is null or ${t.acceptedQuantity} between 0 and ${t.quantity}) and (${t.restockQuantity} is null or ${t.restockQuantity} between 0 and ${t.acceptedQuantity})`)])
export const returnEvents = pgTable('sales_return_event', {
  id: uuid('id').defaultRandom().primaryKey(), returnId: uuid('return_id').notNull().references(() => returns.id),
  actorId: uuid('actor_id').notNull().references(() => user.id), commandId: uuid('command_id').notNull().unique().references(() => fulfillmentCommands.id),
  status: text('status').notNull(), note: text('note').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
export const refunds = pgTable('refund', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id),
  returnId: uuid('return_id').references(() => returns.id), paymentId: uuid('payment_id').notNull().references(() => payments.id),
  actorId: uuid('actor_id').notNull().references(() => user.id), purpose: text('purpose').notNull(), reason: text('reason').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(), shippingAmount: bigint('shipping_amount', { mode: 'number' }).default(0).notNull(),
  provider: text('provider').notNull(), currency: text('currency').notNull(), providerAmount: numeric('provider_amount',{precision:14,scale:2}).notNull(),
  reference: text('reference').notNull().unique(), providerRefundId: text('provider_refund_id'),
  state: text('state').default('pending').notNull(), submittedAt: timestamp('submitted_at',{withTimezone:true}),
  proof: text('proof'), lastError: text('last_error'), ...timestamps,
}, t => [index('refund_order_idx').on(t.orderId), uniqueIndex('refund_return_unique').on(t.returnId).where(sql`${t.state}<>'failed'`), check('refund_state_check',sql`${t.state} in ('pending','processing','succeeded','failed','needs_review')`), check('refund_amount_check',sql`${t.amount}>0 and ${t.shippingAmount} between 0 and ${t.amount}`)])
export const refundAttempts = pgTable('refund_attempt', {
  id: uuid('id').defaultRandom().primaryKey(), refundId: uuid('refund_id').notNull().references(() => refunds.id),
  action: text('action').notNull(), state: text('state').notNull(), code: text('code'),
  createdAt: timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
})
export const webhookInbox = pgTable('webhook_inbox', {
  id: uuid('id').defaultRandom().primaryKey(), provider: text('provider').notNull(), eventId: text('event_id').notNull(),
  reference: text('reference').notNull(), kind: text('kind').notNull(), createdAt: timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
}, t => [uniqueIndex('webhook_inbox_provider_event_unique').on(t.provider,t.eventId)])
export const outbox = pgTable('outbox', {
  id: uuid('id').defaultRandom().primaryKey(), key: text('key').notNull().unique(), kind: text('kind').notNull(), payload: jsonb('payload').notNull(),
  state: text('state').default('pending').notNull(), attempts: integer('attempts').default(0).notNull(),
  availableAt: timestamp('available_at',{withTimezone:true}).defaultNow().notNull(), leaseUntil: timestamp('lease_until',{withTimezone:true}), leaseToken: uuid('lease_token'),
  lastError: text('last_error'), ...timestamps,
}, t => [index('outbox_work_idx').on(t.state,t.availableAt)])
export const jobLeases = pgTable('job_lease', {
  name: text('name').primaryKey(), token: uuid('token'), leaseUntil: timestamp('lease_until',{withTimezone:true}),
  lastStartedAt: timestamp('last_started_at',{withTimezone:true}), lastFinishedAt: timestamp('last_finished_at',{withTimezone:true}),
  lastError: text('last_error'), result: jsonb('result'),
})

export const favorites=pgTable('favorite',{
  userId:uuid('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),productId:uuid('product_id').notNull().references(()=>products.id,{onDelete:'cascade'}),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
},t=>[primaryKey({columns:[t.userId,t.productId]})])
export const notificationPreferences=pgTable('notification_preference',{
  userId:uuid('user_id').primaryKey().references(()=>user.id,{onDelete:'cascade'}),transactional:boolean('transactional').default(true).notNull(),marketing:boolean('marketing').default(false).notNull(),...timestamps,
})
export const newsletterSubscriptions=pgTable('newsletter_subscription',{
  id:uuid('id').defaultRandom().primaryKey(),email:text('email').notNull().unique(),state:text('state').default('pending').notNull(),consentedAt:timestamp('consented_at',{withTimezone:true}).notNull(),confirmedAt:timestamp('confirmed_at',{withTimezone:true}),unsubscribedAt:timestamp('unsubscribed_at',{withTimezone:true}),generation:integer('generation').default(1).notNull(),source:text('source').notNull(),...timestamps,
},t=>[check('newsletter_state',sql`${t.state} in ('pending','confirmed','unsubscribed')`)])
export const newsletterTokens=pgTable('newsletter_token',{
  id:uuid('id').defaultRandom().primaryKey(),subscriptionId:uuid('subscription_id').notNull().references(()=>newsletterSubscriptions.id,{onDelete:'cascade'}),hash:text('hash').notNull().unique(),purpose:text('purpose').notNull(),generation:integer('generation').notNull(),expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),usedAt:timestamp('used_at',{withTimezone:true}),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
},t=>[check('newsletter_token_purpose',sql`${t.purpose} in ('confirm','unsubscribe')`)])
export const accountAudits=pgTable('account_audit',{
  id:uuid('id').defaultRandom().primaryKey(),actorId:uuid('actor_id').references(()=>user.id),subjectId:uuid('subject_id').references(()=>user.id),action:text('action').notNull(),details:jsonb('details').default({}).notNull(),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
})
export const catalogWrites=pgTable('catalog_write',{
  id:uuid('id').primaryKey(),productId:uuid('product_id').notNull().references(()=>products.id),actorId:uuid('actor_id').notNull().references(()=>user.id),hash:text('hash').notNull(),result:jsonb('result'),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
})
export const supportCommands=pgTable('support_command',{
  id:uuid('id').primaryKey(),actorId:uuid('actor_id').notNull().references(()=>user.id),hash:text('hash').notNull(),result:jsonb('result'),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
})

// Auxiliary Express sessions do not replace Better Auth's account/session tables.
export const httpSessions=pgTable('http_session',{
 sid:text('sid').primaryKey(),data:jsonb('data').notNull(),expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),
},t=>[index('http_session_expires_idx').on(t.expiresAt)])

export const schema = { httpSessions, favorites,notificationPreferences,newsletterSubscriptions,newsletterTokens,accountAudits,catalogWrites,supportCommands, fulfillmentCommands, orderFulfillments, shipmentEvents, orderAllocations, returns, returnItems, returnEvents, refunds, refundAttempts, webhookInbox, outbox, jobLeases, campaigns, inventoryOperations, inventoryBaselines, inventoryReservations, uploadAssets,
  ...authSchema, checkoutSessions, addresses, attributeValues, attributes, brands, cartItems, carts, categories,
  conversationParticipants, conversations, inventoryBalances, inventoryLocations, messageAttachments,
  messages, orderAddresses, orderItems, orderStatusHistories, orders, payments, productContentSections,
  productMedia, productReviews, productVariants, products, promotionCodes, promotionUsages, promotions,
  shipments, stockMovements, variantAttributeValues,
}
