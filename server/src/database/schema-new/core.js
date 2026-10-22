import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, numeric, pgTable, primaryKey, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { user } from './auth.js'
import { createdAt, updatedAt } from './shared.js'

export const roles = pgTable('role', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 128 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const permissions = pgTable('permission', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 128 }).notNull().unique(),
  description: text('description'),
  createdAt: createdAt(),
})

export const rolePermissions = pgTable('role_permission', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })])

export const userRoles = pgTable('user_role', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedBy: text('assigned_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (table) => [primaryKey({ columns: [table.userId, table.roleId] })])

export const addresses = pgTable('address', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: text('account_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 64 }).default('home').notNull(),
  recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  recipientPhone: varchar('recipient_phone', { length: 32 }).notNull(),
  line1: varchar('line_1', { length: 255 }).notNull(),
  line2: varchar('line_2', { length: 255 }),
  ward: varchar('ward', { length: 128 }),
  district: varchar('district', { length: 128 }).notNull(),
  province: varchar('province', { length: 128 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }),
  countryCode: varchar('country_code', { length: 2 }).default('VN').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('address_account_idx').on(table.accountId),
  uniqueIndex('address_one_default_per_account_idx').on(table.accountId).where(sql`${table.isDefault} = true`),
])

export const inventoryLocations = pgTable('inventory_location', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 32 }).default('store').notNull(),
  phone: varchar('phone', { length: 32 }),
  email: varchar('email', { length: 255 }),
  addressLine: text('address_line'),
  ward: varchar('ward', { length: 128 }),
  district: varchar('district', { length: 128 }),
  province: varchar('province', { length: 128 }),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  supportsPickup: boolean('supports_pickup').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('inventory_location_type_active_idx').on(table.type, table.isActive)])

export const locationHours = pgTable('location_hour', {
  id: uuid('id').defaultRandom().primaryKey(),
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  opensAt: varchar('opens_at', { length: 5 }),
  closesAt: varchar('closes_at', { length: 5 }),
  isClosed: boolean('is_closed').default(false).notNull(),
}, (table) => [
  uniqueIndex('location_hour_location_day_idx').on(table.locationId, table.dayOfWeek),
  check('location_hour_day_check', sql`${table.dayOfWeek} between 0 and 6`),
])

export const coreSchema = { addresses, inventoryLocations, locationHours, permissions, rolePermissions, roles, userRoles }
