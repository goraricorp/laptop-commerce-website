import { randomInt, randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { applyStockOperation } from '../src/services/stock-ledger.js'
import { db, pool } from '../src/database/index.js'
import { categories, products, productVariants, inventoryLocations, inventoryBalances, stockMovements } from '../src/database/schema.js'

// Only seed variants without inventory; reruns never reset stock or reservations.
try {
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('seed-inventory'))`)
    // Prevent stock writes during the initial inventory check and inserts.
    await tx.execute(sql`lock table inventory_balance in share row exclusive mode`)
    const categoryRows = await tx.select().from(categories)
    const categoryMap = new Map(categoryRows.map((category) => [category.id, category]))
    if (!categoryRows.some((category) => category.slug === 'laptop')) {
      throw new Error('Laptop category not found; no stock was changed')
    }
    const isLaptop = (categoryId) => {
      const visited = new Set()
      while (categoryId && !visited.has(categoryId)) {
        visited.add(categoryId)
        const category = categoryMap.get(categoryId)
        if (category?.slug === 'laptop') return true
        categoryId = category?.parentId
      }
      return false
    }
    const variants = await tx.select({ id: productVariants.id, categoryId: products.categoryId })
      .from(productVariants).innerJoin(products, eq(products.id, productVariants.productId))
    const existing = new Set((await tx.select({ id: inventoryBalances.variantId }).from(inventoryBalances)).map((row) => row.id))
    const missing = variants.filter((variant) => !existing.has(variant.id))
    const summary = { variants: variants.length, skipped: variants.length - missing.length, laptop: { variants: 0, units: 0 }, other: { variants: 0, units: 0 } }
    if (!missing.length) return summary

    let [location] = await tx.select().from(inventoryLocations)
      .where(sql`${inventoryLocations.isActive} = true and ${inventoryLocations.type} = 'warehouse'`)
      .orderBy(inventoryLocations.code).limit(1)
    if (!location) {
      [location] = await tx.insert(inventoryLocations).values({
        code: 'SEED-WAREHOUSE', name: 'Kho hàng chính', type: 'warehouse', isActive: true,
      }).returning()
    }
    const referenceId = randomUUID()
    const balances = missing.map((variant) => {
      const laptop = isLaptop(variant.categoryId)
      const quantityOnHand = laptop ? randomInt(2, 5) : randomInt(3, 6)
      const group = laptop ? summary.laptop : summary.other
      group.variants++
      group.units += quantityOnHand
      return { locationId: location.id, variantId: variant.id, quantityOnHand, quantityReserved: 0 }
    })
    await applyStockOperation(tx, { key: `seed:${referenceId}`, kind: 'receipt', referenceType: 'inventory_seed', referenceId,
      note: 'Tồn kho seed ban đầu; chỉ chạy trong phạm vi dữ liệu đã duyệt.',
      movements: balances.map(balance => ({ locationId: balance.locationId, variantId: balance.variantId, type: 'receipt', quantity: balance.quantityOnHand, onHandDelta: balance.quantityOnHand, reservedDelta: 0 })),
    })
    const persisted = await tx.select({ quantity: stockMovements.quantity }).from(stockMovements)
      .where(eq(stockMovements.referenceId, referenceId))
    if (persisted.length !== balances.length || persisted.reduce((sum, row) => sum + row.quantity, 0) !== summary.laptop.units + summary.other.units) {
      throw new Error('Inventory receipt verification failed; transaction rolled back')
    }
    return { ...summary, location: location.code, receipts: persisted.length }
  })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  // Database errors can contain credentials or connection details.
  console.error('Inventory seed failed; transaction rolled back. Error code:', error.code || error.cause?.code || error.name)
  process.exitCode = 1
} finally {
  await pool.end()
}
