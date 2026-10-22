import { sql } from 'drizzle-orm'
import { boolean, check, foreignKey, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { inventoryLocations } from './core.js'
import { createdAt, metadata, money, updatedAt } from './shared.js'

export const categories = pgTable('category', {
  id: uuid('id').defaultRandom().primaryKey(),
  parentId: uuid('parent_id'),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  image: text('image'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  foreignKey({ columns: [table.parentId], foreignColumns: [table.id], name: 'category_parent_id_fk' }).onDelete('set null'),
  index('category_parent_idx').on(table.parentId),
  check('category_parent_self_check', sql`${table.parentId} is null or ${table.parentId} <> ${table.id}`),
])

export const brands = pgTable('brand', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  logo: text('logo'),
  description: text('description'),
  website: text('website'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const products = pgTable('product', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  productType: varchar('product_type', { length: 64 }).notNull(),
  model: varchar('model', { length: 128 }),
  shortDescription: text('short_description'),
  description: text('description'),
  status: varchar('status', { length: 32 }).default('draft').notNull(),
  warrantyMonths: integer('warranty_months').default(0).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('product_category_status_idx').on(table.categoryId, table.status),
  index('product_brand_idx').on(table.brandId),
  index('product_type_idx').on(table.productType),
  check('product_warranty_months_check', sql`${table.warrantyMonths} >= 0`),
])

export const productVariants = pgTable('product_variant', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 64 }).notNull().unique(),
  barcode: varchar('barcode', { length: 64 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 32 }).default('active').notNull(),
  condition: varchar('condition', { length: 32 }).default('new').notNull(),
  costPrice: money('cost_price'),
  price: money('price').notNull(),
  compareAtPrice: money('compare_at_price'),
  weightGrams: integer('weight_grams'),
  lengthMm: integer('length_mm'),
  widthMm: integer('width_mm'),
  heightMm: integer('height_mm'),
  warrantyMonths: integer('warranty_months'),
  isDefault: boolean('is_default').default(false).notNull(),
  metadata: metadata(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('product_variant_product_status_idx').on(table.productId, table.status),
  uniqueIndex('product_variant_one_default_idx').on(table.productId).where(sql`${table.isDefault} = true and ${table.deletedAt} is null`),
  check('product_variant_price_check', sql`${table.price} >= 0`),
  check('product_variant_cost_check', sql`${table.costPrice} is null or ${table.costPrice} >= 0`),
  check('product_variant_dimensions_check', sql`(${table.weightGrams} is null or ${table.weightGrams} >= 0) and (${table.lengthMm} is null or ${table.lengthMm} >= 0) and (${table.widthMm} is null or ${table.widthMm} >= 0) and (${table.heightMm} is null or ${table.heightMm} >= 0)`),
])

export const productMedia = pgTable('product_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 16 }).default('image').notNull(),
  url: text('url').notNull(),
  altText: varchar('alt_text', { length: 255 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: createdAt(),
}, (table) => [index('product_media_product_sort_idx').on(table.productId, table.sortOrder)])

export const productContentSections = pgTable('product_content_section', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  mediaUrl: text('media_url'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('product_content_product_sort_idx').on(table.productId, table.sortOrder)])

export const attributes = pgTable('attribute', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 128 }).notNull(),
  dataType: varchar('data_type', { length: 16 }).default('text').notNull(),
  unit: varchar('unit', { length: 32 }),
  isVariant: boolean('is_variant').default(false).notNull(),
  isFilterable: boolean('is_filterable').default(false).notNull(),
  isComparable: boolean('is_comparable').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const attributeValues = pgTable('attribute_value', {
  id: uuid('id').defaultRandom().primaryKey(),
  attributeId: uuid('attribute_id').notNull().references(() => attributes.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 128 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  value: text('value'),
  colorHex: varchar('color_hex', { length: 9 }),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [uniqueIndex('attribute_value_attribute_code_idx').on(table.attributeId, table.code)])

export const categoryAttributes = pgTable('category_attribute', {
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  attributeId: uuid('attribute_id').notNull().references(() => attributes.id, { onDelete: 'cascade' }),
  isRequired: boolean('is_required').default(false).notNull(),
  isVariant: boolean('is_variant').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [primaryKey({ columns: [table.categoryId, table.attributeId] })])

export const productAttributeValues = pgTable('product_attribute_value', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  attributeId: uuid('attribute_id').notNull().references(() => attributes.id, { onDelete: 'cascade' }),
  attributeValueId: uuid('attribute_value_id').references(() => attributeValues.id, { onDelete: 'set null' }),
  valueText: text('value_text'),
  valueNumber: numeric('value_number', { precision: 18, scale: 6 }),
  valueBoolean: boolean('value_boolean'),
  valueJson: jsonb('value_json'),
}, (table) => [
  uniqueIndex('product_attribute_product_attribute_idx').on(table.productId, table.attributeId),
  index('product_attribute_filter_idx').on(table.attributeId, table.attributeValueId),
])

export const variantAttributeValues = pgTable('variant_attribute_value', {
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  attributeId: uuid('attribute_id').notNull().references(() => attributes.id, { onDelete: 'cascade' }),
  attributeValueId: uuid('attribute_value_id').references(() => attributeValues.id, { onDelete: 'set null' }),
  valueText: text('value_text'),
  valueNumber: numeric('value_number', { precision: 18, scale: 6 }),
  valueBoolean: boolean('value_boolean'),
}, (table) => [
  primaryKey({ columns: [table.variantId, table.attributeId] }),
  index('variant_attribute_filter_idx').on(table.attributeId, table.attributeValueId),
])

export const compatibilityRules = pgTable('compatibility_rule', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  sourceCategoryId: uuid('source_category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  targetCategoryId: uuid('target_category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  ruleType: varchar('rule_type', { length: 32 }).notNull(),
  expression: jsonb('expression').notNull(),
  errorMessage: text('error_message').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('compatibility_rule_categories_idx').on(table.sourceCategoryId, table.targetCategoryId)])

export const collections = pgTable('collection', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  image: text('image'),
  isActive: boolean('is_active').default(true).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const collectionProducts = pgTable('collection_product', {
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [primaryKey({ columns: [table.collectionId, table.productId] })])

export const productRelations = pgTable('product_relation', {
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  relatedProductId: uuid('related_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  relationType: varchar('relation_type', { length: 32 }).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [
  primaryKey({ columns: [table.productId, table.relatedProductId, table.relationType] }),
  check('product_relation_self_check', sql`${table.productId} <> ${table.relatedProductId}`),
])

export const priceLists = pgTable('price_list', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  currency: varchar('currency', { length: 3 }).default('VND').notNull(),
  locationId: uuid('location_id').references(() => inventoryLocations.id, { onDelete: 'cascade' }),
  customerSegment: varchar('customer_segment', { length: 64 }),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const priceListItems = pgTable('price_list_item', {
  priceListId: uuid('price_list_id').notNull().references(() => priceLists.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  price: money('price').notNull(),
  compareAtPrice: money('compare_at_price'),
}, (table) => [
  primaryKey({ columns: [table.priceListId, table.variantId] }),
  check('price_list_item_price_check', sql`${table.price} >= 0`),
])

export const catalogSchema = {
  attributes,
  attributeValues,
  brands,
  categories,
  categoryAttributes,
  collectionProducts,
  collections,
  compatibilityRules,
  priceListItems,
  priceLists,
  productAttributeValues,
  productContentSections,
  productMedia,
  productRelations,
  products,
  productVariants,
  variantAttributeValues,
}
