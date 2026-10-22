import fs from 'node:fs/promises'
import process from 'node:process'
import { and, eq, inArray } from 'drizzle-orm'
import { db, pool } from '../src/database/index.js'
import { products, productVariants, categories, inventoryBalances } from '../src/database/schema.js'
try {
  const data = JSON.parse(await fs.readFile(new URL('./think-data.json', import.meta.url), 'utf8'))
  // Navigation entries from the old scraper are not laptop products.
  const navigationNames = ['Ghế công thái học,', 'Bàn nâng hạ', 'Thực tế ảo/ Game Console', 'Arm màn hình', 'Cổng chuyển,']
  const result = await db.transaction(async tx => {
    const [category] = await tx.select().from(categories).where(eq(categories.slug, 'laptop'))
    const invalid = await tx.select().from(products).where(and(eq(products.categoryId, category.id), inArray(products.name, navigationNames)))
    if (process.argv.includes('--quarantine-navigation') && invalid.length) {
      const ids = invalid.map(row => row.id)
      await tx.update(products).set({ status: 'draft' }).where(inArray(products.id, ids))
      await tx.update(productVariants).set({ status: 'inactive' }).where(inArray(productVariants.productId, ids))
    }
    const laptops = await tx.select().from(products).where(eq(products.categoryId, category.id))
    const variants = await tx.select().from(productVariants).where(inArray(productVariants.productId, laptops.map(row => row.id)))
    let checked = 0
    for (const item of data.laptop) {
      const product = laptops.find(row => row.name === item.name)
      if (!product) throw new Error('Missing imported laptop')
      for (const source of item.variants) {
        const variant = variants.find(row => row.productId === product.id && row.sku === `THINKPRO-${product.id.slice(0, 8)}-${source.sourceId}`)
        if (!variant || Number(variant.price) !== source.price || variant.name !== source.name) throw new Error('SKU, name or price mismatch')
        checked++
      }
    }
    const stock = await tx.select().from(inventoryBalances)
    return { laptopProducts: data.laptop.length, laptopVariantsVerified: checked, activeZeroPriceLaptopVariants: variants.filter(row => row.status === 'active' && Number(row.price) <= 0).length, navigationDrafts: invalid.length, stockRows: stock.length, stockUnits: stock.reduce((sum, row) => sum + row.quantityOnHand, 0) }
  })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error('Verification failed:', error.code || error.cause?.code || error.name)
  process.exitCode = 1
} finally { await pool.end() }
