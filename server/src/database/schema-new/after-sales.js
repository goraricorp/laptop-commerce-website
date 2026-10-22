import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { user } from './auth.js'
import { products, productVariants } from './catalog.js'
import { orderItems, orders } from './commerce.js'
import { inventoryLocations } from './core.js'
import { inventorySerials } from './inventory.js'
import { createdAt, metadata, money, updatedAt } from './shared.js'

export const returnRequests = pgTable('return_request', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 64 }).notNull().unique(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 32 }).default('return').notNull(),
  reason: varchar('reason', { length: 128 }).notNull(),
  customerNote: text('customer_note'),
  attachments: jsonb('attachments').default(sql`'[]'::jsonb`).notNull(),
  status: varchar('status', { length: 32 }).default('requested').notNull(),
  resolution: varchar('resolution', { length: 32 }),
  returnLocationId: uuid('return_location_id').references(() => inventoryLocations.id, { onDelete: 'set null' }),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('return_request_order_status_idx').on(table.orderId, table.status)])

export const returnItems = pgTable('return_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  returnRequestId: uuid('return_request_id').notNull().references(() => returnRequests.id, { onDelete: 'cascade' }),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  condition: varchar('condition', { length: 64 }),
  inspectionNote: text('inspection_note'),
  restockDisposition: varchar('restock_disposition', { length: 32 }),
  refundAmount: money('refund_amount').default('0').notNull(),
}, (table) => [
  uniqueIndex('return_item_request_order_item_idx').on(table.returnRequestId, table.orderItemId),
  check('return_item_quantity_check', sql`${table.quantity} > 0 and ${table.refundAmount} >= 0`),
])

export const warrantyPolicies = pgTable('warranty_policy', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 32 }).default('manufacturer').notNull(),
  durationMonths: integer('duration_months').notNull(),
  terms: text('terms').notNull(),
  price: money('price').default('0').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [check('warranty_policy_duration_check', sql`${table.durationMonths} > 0 and ${table.price} >= 0`)])

export const productWarrantyPolicies = pgTable('product_warranty_policy', {
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  warrantyPolicyId: uuid('warranty_policy_id').notNull().references(() => warrantyPolicies.id, { onDelete: 'cascade' }),
  isDefault: boolean('is_default').default(false).notNull(),
}, (table) => [primaryKey({ columns: [table.productId, table.warrantyPolicyId] })])

export const warranties = pgTable('warranty', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'restrict' }),
  policyId: uuid('policy_id').references(() => warrantyPolicies.id, { onDelete: 'set null' }),
  serialId: uuid('serial_id').references(() => inventorySerials.id, { onDelete: 'set null' }),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 32 }).default('active').notNull(),
  createdAt: createdAt(),
}, (table) => [
  index('warranty_account_status_idx').on(table.accountId, table.status),
  check('warranty_dates_check', sql`${table.endsAt} > ${table.startsAt}`),
])

export const warrantyClaims = pgTable('warranty_claim', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 64 }).notNull().unique(),
  warrantyId: uuid('warranty_id').notNull().references(() => warranties.id, { onDelete: 'restrict' }),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  serviceLocationId: uuid('service_location_id').references(() => inventoryLocations.id, { onDelete: 'set null' }),
  issueDescription: text('issue_description').notNull(),
  status: varchar('status', { length: 32 }).default('submitted').notNull(),
  resolution: varchar('resolution', { length: 32 }),
  technicianNote: text('technician_note'),
  assignedTo: text('assigned_to').references(() => user.id, { onDelete: 'set null' }),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('warranty_claim_status_date_idx').on(table.status, table.createdAt)])

export const warrantyClaimEvents = pgTable('warranty_claim_event', {
  id: uuid('id').defaultRandom().primaryKey(),
  claimId: uuid('claim_id').notNull().references(() => warrantyClaims.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 32 }).notNull(),
  note: text('note'),
  attachments: jsonb('attachments').default(sql`'[]'::jsonb`).notNull(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (table) => [index('warranty_claim_event_claim_date_idx').on(table.claimId, table.createdAt)])

export const repairTickets = pgTable('repair_ticket', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 64 }).notNull().unique(),
  warrantyClaimId: uuid('warranty_claim_id').references(() => warrantyClaims.id, { onDelete: 'set null' }),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  serviceLocationId: uuid('service_location_id').references(() => inventoryLocations.id, { onDelete: 'set null' }),
  serialNumber: varchar('serial_number', { length: 128 }),
  deviceSnapshot: jsonb('device_snapshot').notNull(),
  issueDescription: text('issue_description').notNull(),
  diagnosis: text('diagnosis'),
  status: varchar('status', { length: 32 }).default('received').notNull(),
  laborCost: money('labor_cost').default('0').notNull(),
  partsCost: money('parts_cost').default('0').notNull(),
  assignedTo: text('assigned_to').references(() => user.id, { onDelete: 'set null' }),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  promisedAt: timestamp('promised_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [check('repair_ticket_cost_check', sql`${table.laborCost} >= 0 and ${table.partsCost} >= 0`)])

export const repairTicketParts = pgTable('repair_ticket_part', {
  ticketId: uuid('ticket_id').notNull().references(() => repairTickets.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  unitCost: money('unit_cost').notNull(),
}, (table) => [
  primaryKey({ columns: [table.ticketId, table.variantId] }),
  check('repair_ticket_part_check', sql`${table.quantity} > 0 and ${table.unitCost} >= 0`),
])

export const tradeIns = pgTable('trade_in', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 64 }).notNull().unique(),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  locationId: uuid('location_id').references(() => inventoryLocations.id, { onDelete: 'set null' }),
  deviceType: varchar('device_type', { length: 64 }).notNull(),
  brand: varchar('brand', { length: 128 }),
  model: varchar('model', { length: 255 }).notNull(),
  serialNumber: varchar('serial_number', { length: 128 }),
  condition: jsonb('condition').default(sql`'{}'::jsonb`).notNull(),
  estimatedValue: money('estimated_value'),
  finalValue: money('final_value'),
  status: varchar('status', { length: 32 }).default('submitted').notNull(),
  inspectedBy: text('inspected_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [check('trade_in_value_check', sql`(${table.estimatedValue} is null or ${table.estimatedValue} >= 0) and (${table.finalValue} is null or ${table.finalValue} >= 0)`)])

export const installmentProviders = pgTable('installment_provider', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  logo: text('logo'),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: metadata(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const installmentPlans = pgTable('installment_plan', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').notNull().references(() => installmentProviders.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  termMonths: integer('term_months').notNull(),
  interestRate: numeric('interest_rate', { precision: 7, scale: 4 }).default('0').notNull(),
  downPaymentRate: numeric('down_payment_rate', { precision: 7, scale: 4 }).default('0').notNull(),
  minimumAmount: money('minimum_amount').default('0').notNull(),
  maximumAmount: money('maximum_amount'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [check('installment_plan_values_check', sql`${table.termMonths} > 0 and ${table.interestRate} >= 0 and ${table.downPaymentRate} >= 0 and ${table.minimumAmount} >= 0`)])

export const installmentApplications = pgTable('installment_application', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  planId: uuid('plan_id').notNull().references(() => installmentPlans.id, { onDelete: 'restrict' }),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  amount: money('amount').notNull(),
  downPayment: money('down_payment').default('0').notNull(),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  providerReference: varchar('provider_reference', { length: 255 }),
  submittedData: jsonb('submitted_data').default(sql`'{}'::jsonb`).notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [check('installment_application_amount_check', sql`${table.amount} > 0 and ${table.downPayment} >= 0`)])

export const afterSalesSchema = {
  installmentApplications,
  installmentPlans,
  installmentProviders,
  productWarrantyPolicies,
  repairTicketParts,
  repairTickets,
  returnItems,
  returnRequests,
  tradeIns,
  warranties,
  warrantyClaimEvents,
  warrantyClaims,
  warrantyPolicies,
}
