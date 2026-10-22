import { db, pool } from '../src/database/index.js';
import {
  attributes,
  attributeValues,
  brands,
  categories,
  productMedia,
  products,
  productVariants,
  variantAttributeValues,
} from '../src/database/schema.js';
import { eq, inArray } from 'drizzle-orm';
import fs from 'fs/promises';
import process from 'process';

// ====================== CONFIG ======================
const DATA_FILE = new URL('./think-data.json', import.meta.url) // file bạn cào được
const LAPTOP_ONLY = process.argv.includes('--laptop-only')

// Mapping slug category trong data.json → slug trong DB
const CATEGORY_SLUG_MAP = {
  laptop: 'laptop',
  monitor: 'monitor',
  'portable-monitor': 'portable-monitor',
  keyboard: 'keyboard',
  mouse: 'mouse',
  'monitor-arm': 'monitor-arm',
  'hub-adapter': 'hub-adapter',
  charger: 'charger',
  backpack: 'backpack',
  speaker: 'speaker',
  ram: 'ram',
  storage: 'storage',
  'ergonomic-chair': 'ergonomic-chair',
  'standing-desk': 'standing-desk',
  'game-console': 'game-console',
}

// ====================== HELPERS ======================
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200)
}

function extractBrand(name) {
  const brandsList = [
    'Apple', 'MacBook', 'Macbook',
    'Lenovo', 'ThinkPad', 'ThinkBook', 'Legion', 'IdeaPad', 'Yoga',
    'Dell', 'XPS', 'Latitude', 'Inspiron', 'Precision', 'Alienware', 'Vostro',
    'HP', 'EliteBook', 'ProBook', 'Pavilion', 'Omen', 'Spectre', 'Envy',
    'Asus', 'ASUS', 'ROG', 'TUF', 'Zenbook', 'Vivobook', 'ExpertBook',
    'MSI', 'Acer', 'Gigabyte', 'AORUS', 'Microsoft', 'Surface',
    'Samsung', 'LG', 'ARZOPA', 'ViewSonic', 'BenQ',
  ]
  for (const b of brandsList) {
    if (name.toLowerCase().includes(b.toLowerCase())) {
      if (b.toLowerCase().includes('macbook')) return 'Apple'
      if (['thinkpad', 'thinkbook', 'legion', 'ideapad', 'yoga'].includes(b.toLowerCase())) return 'Lenovo'
      if (['xps', 'latitude', 'inspiron', 'precision', 'alienware', 'vostro'].includes(b.toLowerCase())) return 'Dell'
      if (['elitebook', 'probook', 'pavilion', 'omen', 'spectre', 'envy'].includes(b.toLowerCase())) return 'HP'
      if (['rog', 'tuf', 'zenbook', 'vivobook', 'expertbook'].includes(b.toLowerCase())) return 'Asus'
      return b
    }
  }
  return null
}

function isValidProduct(item) {
  if (!item?.name || !item?.href) return false
  // Bỏ các record lỗi (tên category, giá ảo, link category...)
  if (item.name.length < 8) return false
  if (item.href.includes('/ghe-cong-thai-hoc') && !item.name.normalize('NFC').toLowerCase().includes('ghế')) return false
  if (item.price !== undefined && item.price !== null && item.price < 100000) return false // giá quá thấp → bỏ
  if (!item.href.match(/\/(laptop|man-hinh|ban-phim|chuot|ghe|ban-nang|may-choi|arm|ram|o-cung|cong-chuyen|sac|balo|am-thanh)\//)) {
    // cho phép một số trường hợp
  }
  return true
}

function cleanPrice(price) {
  if (price === null || price === undefined) return null
  const num = Number(price)
  if (isNaN(num) || num < 1000) return null
  return num.toFixed(2)
}

// ====================== MAIN ======================
async function ensureCategory(slug, name) {
  const existing = await db.query.categories.findFirst({
    where: { slug },
  })
  if (existing) return existing.id

  const [inserted] = await db
    .insert(categories)
    .values({
      name,
      slug,
      position: 0,
      isActive: true,
    })
    .returning({ id: categories.id })
  return inserted.id
}

async function ensureBrand(brandName, db) {
  const slug = slugify(brandName)
  const existing = await db.query.brands.findFirst({
    where: { slug },
  })
  if (existing) return existing.id

  const [inserted] = await db
    .insert(brands)
    .values({
      name: brandName,
      slug,
      isActive: true,
    })
    .returning({ id: brands.id })
  return inserted.id
}

async function syncAttributes(tx, variantId, pairs) {
  const input = pairs.filter(([label, value]) => label && typeof value === 'string' && value.trim()).map(([label, value]) => ({ name: label.slice(0, 100), code: slugify(label).slice(0, 100), value: value.trim().slice(0, 250) }))
  const known = await tx.select().from(attributes)
  const needed = [...new Map(input.filter(row => !known.some(attr => attr.code === row.code || attr.name === row.name)).map(row => [row.code, { name: row.name, code: row.code, displayType: 'text', isFilterable: true, position: 0 }])).values()]
  if (needed.length) known.push(...await tx.insert(attributes).values(needed).onConflictDoNothing().returning())
  const values = [...new Map(input.map(row => {
    const attr = known.find(attr => attr.code === row.code || attr.name === row.name)
    if (!attr) throw new Error('Attribute mapping failed')
    return [`${attr.id}:${row.value}`, { attributeId: attr.id, value: row.value, code: slugify(row.value).slice(0, 100) }]
  })).values()]
  if (!values.length) return
  await tx.insert(attributeValues).values(values).onConflictDoNothing()
  const stored = await tx.select().from(attributeValues).where(inArray(attributeValues.attributeId, [...new Set(values.map(row => row.attributeId))]))
  const links = stored.filter(row => values.some(value => value.attributeId === row.attributeId && value.value === row.value)).map(row => ({ variantId, attributeValueId: row.id }))
  if (links.length) await tx.insert(variantAttributeValues).values(links).onConflictDoNothing()
}

async function importProduct(item, categoryId) {
  return db.transaction(tx => importProductData(item, categoryId, tx))
}

async function importProductData(item, categoryId, tx) {
  if (!item.variants?.length || item.scrapeError) return null
  const brandName = extractBrand(item.name)
  const brandId = brandName ? await ensureBrand(brandName, tx) : null
  let product = await tx.query.products.findFirst({ where: { name: item.name.slice(0, 255), categoryId } })
  const usable = item.variants.some(variant => variant.available && cleanPrice(variant.price))
  const fields = { name: item.name.slice(0, 255), categoryId, brandId, summary: item.fullName?.slice(0, 500) || null, status: usable ? 'active' : 'draft' }
  if (product) {
    await tx.update(products).set(fields).where(eq(products.id, product.id))
  } else {
    let slug = slugify(item.name), suffix = 1
    const base = slug
    while (await tx.query.products.findFirst({ where: { slug } })) slug = `${base}-${suffix++}`
    ;[product] = await tx.insert(products).values({ ...fields, slug }).returning()
  }
  const existing = await tx.select().from(productVariants).where(eq(productVariants.productId, product.id))
  const matched = new Set()
  for (const [index, source] of item.variants.entries()) {
    const sku = `THINKPRO-${product.id.slice(0, 8)}-${source.sourceId}`
    let variant = existing.find(row => row.sku === sku)
    // Keep the initial imported variant ID and its inventory/order references.
    if (!variant && index === 0 && existing.length === 1 && existing[0].sku.startsWith('TP-')) variant = existing[0]
    const price = cleanPrice(source.price)
    const values = { productId: product.id, sku, name: (source.name || item.name).slice(0, 255), price: price || '0.00', compareAtPrice: cleanPrice(source.compareAtPrice), status: source.available && price ? 'active' : 'inactive' }
    if (variant) {
      ;[variant] = await tx.update(productVariants).set(values).where(eq(productVariants.id, variant.id)).returning()
    } else {
      ;[variant] = await tx.insert(productVariants).values(values).returning()
    }
    matched.add(variant.id)
    // Replace stale imported attributes with the actual source SKU options/specifications.
    await tx.delete(variantAttributeValues).where(eq(variantAttributeValues.variantId, variant.id))
    const pairs = (source.options || []).map(option => [option.type, option.value])
    for (const group of source.specs || []) for (const spec of group.specs || []) pairs.push([spec.label, spec.value])
    await syncAttributes(tx, variant.id, pairs)
    if (item.image) {
      const media = await tx.query.productMedia.findFirst({ where: { productId: product.id, variantId: variant.id } })
      if (!media) await tx.insert(productMedia).values({ productId: product.id, variantId: variant.id, url: item.image, mediaType: 'image', alt: item.name.slice(0, 255), position: 0, isPrimary: index === 0 })
    }
  }
  // Preserve historical SKUs but prevent selling removed configurations.
  for (const variant of existing) if (!matched.has(variant.id)) await tx.update(productVariants).set({ status: 'inactive' }).where(eq(productVariants.id, variant.id))
  return product.id
}

async function main() {
  console.log('🚀 Bắt đầu import...')

  const raw = await fs.readFile(DATA_FILE, 'utf8')
  const data = JSON.parse(raw)

  let total = 0
  let skipped = 0
  let duplicates = 0

  for (const [dataKey, items] of Object.entries(data)) {
    if (LAPTOP_ONLY && dataKey !== 'laptop') continue
    const selectedCategory = process.argv.find(arg => arg.startsWith('--category='))?.slice('--category='.length)
    if (selectedCategory && selectedCategory !== dataKey) continue
    const selectedItems = items
    if (!selectedItems.length) continue
    const categorySlug = CATEGORY_SLUG_MAP[dataKey] || dataKey
    const categoryName =
      items.find((i) => i.category)?.category || dataKey

    console.log(`\n📦 Category: ${categorySlug} (${selectedItems.length} items)`)

    const categoryId = await ensureCategory(categorySlug, categoryName)

    for (const item of selectedItems) {
      if (!item.variants?.length || item.scrapeError || !isValidProduct({ ...item, price: null })) {
        skipped++
        continue
      }

      try {
        const id = await importProduct(item, categoryId)
        if (!id) { duplicates++; continue }
        total++
        if (total % 20 === 0) console.log(`   → đã import ${total}`)
      } catch (err) {
        console.error(`   ✗ Lỗi "${item.name?.slice(0, 40)}":`, err.cause?.constraint || err.constraint || err.code || err.cause?.code || err.name)
        skipped++
      }
    }
  }

  console.log('\n✅ Hoàn tất!')
  console.log(`   Import thành công: ${total}`)
  console.log(`   Bỏ qua / lỗi     : ${skipped}`)
  console.log(`   Đã tồn tại       : ${duplicates}`)

}

main().catch((err) => {
  console.error('Import failed:', err.cause?.constraint || err.constraint || err.code || err.cause?.code || err.name)
  process.exitCode = 1
}).finally(() => pool.end())