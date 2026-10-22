import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { user } from './auth.js'
import { productVariants } from './catalog.js'
import { carts, orders } from './commerce.js'
import { inventoryLocations } from './core.js'
import { createdAt, metadata, money, updatedAt } from './shared.js'

export const suppliers = pgTable('supplier', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  taxCode: varchar('tax_code', { length: 64 }),
  contactName: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 32 }),
  address: text('address'),
  paymentTerms: text('payment_terms'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const supplierVariants = pgTable('supplier_variant', {
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  supplierSku: varchar('supplier_sku', { length: 128 }),
  costPrice: money('cost_price'),
  leadTimeDays: integer('lead_time_days'),
  isPreferred: boolean('is_preferred').default(false).notNull(),
}, (table) => [
  primaryKey({ columns: [table.supplierId, table.variantId] }),
  check('supplier_variant_cost_check', sql`${table.costPrice} is null or ${table.costPrice} >= 0`),
])

export const inventoryBalances = pgTable('inventory_balance', {
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  onHand: integer('on_hand').default(0).notNull(),
  reserved: integer('reserved').default(0).notNull(),
  reorderPoint: integer('reorder_point').default(0).notNull(),
  safetyStock: integer('safety_stock').default(0).notNull(),
  updatedAt: updatedAt(),
}, (table) => [
  primaryKey({ columns: [table.locationId, table.variantId] }),
  index('inventory_balance_variant_idx').on(table.variantId),
  check('inventory_balance_check', sql`${table.onHand} >= 0 and ${table.reserved} >= 0 and ${table.reserved} <= ${table.onHand} and ${table.reorderPoint} >= 0 and ${table.safetyStock} >= 0`),
])

export const inventorySerials = pgTable('inventory_serial', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  locationId: uuid('location_id').references(() => inventoryLocations.id, { onDelete: 'set null' }),
  serialNumber: varchar('serial_number', { length: 128 }).notNull().unique(),
  imei: varchar('imei', { length: 32 }).unique(),
  status: varchar('status', { length: 32 }).default('available').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  soldAt: timestamp('sold_at', { withTimezone: true }),
  metadata: metadata(),
}, (table) => [index('inventory_serial_variant_status_idx').on(table.variantId, table.status)])

export const stockMovements = pgTable('stock_movement', {
  id: uuid('id').defaultRandom().primaryKey(),
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  type: varchar('type', { length: 32 }).notNull(),
  quantity: integer('quantity').notNull(),
  referenceType: varchar('reference_type', { length: 32 }),
  referenceId: uuid('reference_id'),
  reason: text('reason'),
  performedBy: text('performed_by').references(() => user.id, { onDelete: 'set null' }),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: metadata(),
}, (table) => [
  index('stock_movement_location_variant_date_idx').on(table.locationId, table.variantId, table.occurredAt),
  check('stock_movement_quantity_check', sql`${table.quantity} <> 0`),
])

export const stockReservations = pgTable('stock_reservation', {
  id: uuid('id').defaultRandom().primaryKey(),
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  cartId: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  status: varchar('status', { length: 32 }).default('active').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: createdAt(),
}, (table) => [
  index('stock_reservation_expiry_idx').on(table.status, table.expiresAt),
  check('stock_reservation_reference_check', sql`num_nonnulls(${table.cartId}, ${table.orderId}) = 1`),
  check('stock_reservation_quantity_check', sql`${table.quantity} > 0`),
])

export const purchaseOrders = pgTable('purchase_order', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 64 }).notNull().unique(),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'restrict' }),
  destinationLocationId: uuid('destination_location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  status: varchar('status', { length: 32 }).default('draft').notNull(),
  currency: varchar('currency', { length: 3 }).default('VND').notNull(),
  subtotal: money('subtotal').default('0').notNull(),
  taxTotal: money('tax_total').default('0').notNull(),
  total: money('total').default('0').notNull(),
  expectedAt: timestamp('expected_at', { withTimezone: true }),
  notes: text('notes'),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('purchase_order_supplier_status_idx').on(table.supplierId, table.status),
  check('purchase_order_totals_check', sql`${table.subtotal} >= 0 and ${table.taxTotal} >= 0 and ${table.total} >= 0`),
])

export const purchaseOrderItems = pgTable('purchase_order_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  orderedQuantity: integer('ordered_quantity').notNull(),
  receivedQuantity: integer('received_quantity').default(0).notNull(),
  unitCost: money('unit_cost').notNull(),
  taxRate: money('tax_rate').default('0').notNull(),
}, (table) => [
  uniqueIndex('purchase_order_item_variant_idx').on(table.purchaseOrderId, table.variantId),
  check('purchase_order_item_quantity_check', sql`${table.orderedQuantity} > 0 and ${table.receivedQuantity} >= 0 and ${table.receivedQuantity} <= ${table.orderedQuantity}`),
  check('purchase_order_item_cost_check', sql`${table.unitCost} >= 0`),
])

export const stockTransfers = pgTable('stock_transfer', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 64 }).notNull().unique(),
  sourceLocationId: uuid('source_location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  destinationLocationId: uuid('destination_location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  status: varchar('status', { length: 32 }).default('draft').notNull(),
  requestedBy: text('requested_by').references(() => user.id, { onDelete: 'set null' }),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check('stock_transfer_locations_check', sql`${table.sourceLocationId} <> ${table.destinationLocationId}`),
  index('stock_transfer_status_idx').on(table.status),
])

export const stockTransferItems = pgTable('stock_transfer_item', {
  transferId: uuid('transfer_id').notNull().references(() => stockTransfers.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  requestedQuantity: integer('requested_quantity').notNull(),
  shippedQuantity: integer('shipped_quantity').default(0).notNull(),
  receivedQuantity: integer('received_quantity').default(0).notNull(),
}, (table) => [
  primaryKey({ columns: [table.transferId, table.variantId] }),
  check('stock_transfer_item_quantity_check', sql`${table.requestedQuantity} > 0 and ${table.shippedQuantity} >= 0 and ${table.receivedQuantity} >= 0`),
])

export const inventorySchema = {
  inventoryBalances,
  inventorySerials,
  purchaseOrderItems,
  purchaseOrders,
  stockMovements,
  stockReservations,
  stockTransferItems,
  stockTransfers,
  supplierVariants,
  suppliers,
}
