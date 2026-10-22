import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../database/index.js'
import {
  inventoryBalances,
  inventoryBaselines,
  inventoryReservations,
  inventoryLocations,
  inventoryOperations,
  productVariants,
  stockMovements,
} from '../database/schema.js'
import { applyStockOperation, inventoryTransaction } from './stock-ledger.js'
import {
  locationInput,
  movementInput,
  reorderInput,
  transferInput,
  reconcileAdjustmentInput,
} from '../schemas/inventory.js'
const pair = (locationId, variantId) =>
  and(
    eq(inventoryBalances.locationId, locationId),
    eq(inventoryBalances.variantId, variantId),
  )
const fail = (message, status = 409) => {
  throw Object.assign(new Error(message), { status })
}
function actorId(actor) {
  if (!actor || !['administrator', 'master'].includes(actor.role))
    fail('Bạn không có quyền thao tác kho.', 403)
  return actor.id
}
async function validatePairs(tx, locationIds, variantId) {
  for (const id of [...new Set(locationIds)].sort()) {
    const [location] = await tx
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.id, id))
      .for('share')
    if (!location?.isActive) fail('Kho không tồn tại hoặc đã ngừng hoạt động.')
  }
  if (
    !(
      await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .for('key share')
    )[0]
  )
    fail('SKU không tồn tại.', 400)
}
export const getInventoryLocations = () => db.select().from(inventoryLocations)
export const getInventoryLocation = async (id) =>
  (
    await db
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.id, id))
  )[0] ?? null
export const createInventoryLocation = async (raw) =>
  (
    await db
      .insert(inventoryLocations)
      .values(locationInput.parse(raw))
      .returning()
  )[0]
export const updateInventoryLocation = async (id, raw) =>
  (
    await db
      .update(inventoryLocations)
      .set({
        ...locationInput
          .partial()
          .refine((value) => Object.keys(value).length > 0)
          .parse(raw),
        updatedAt: new Date(),
      })
      .where(eq(inventoryLocations.id, id))
      .returning()
  )[0] ?? null
export async function deleteInventoryLocation(id) {
  return inventoryTransaction(async (tx) => {
    const [location] = await tx
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.id, id))
      .for('update')
    if (!location) return null
    if (
      (
        await tx
          .select()
          .from(inventoryBalances)
          .where(eq(inventoryBalances.locationId, id))
      ).length
    )
      fail('Kho đã có dữ liệu tồn; hãy ngừng hoạt động thay vì xóa.')
    return (
      await tx
        .delete(inventoryLocations)
        .where(eq(inventoryLocations.id, id))
        .returning()
    )[0]
  })
}
export const getInventoryBalances = () => db.select().from(inventoryBalances)
export const getInventoryBalance = async (locationId, variantId) =>
  (
    await db.select().from(inventoryBalances).where(pair(locationId, variantId))
  )[0] ?? null
export const updateInventoryBalance = async (locationId, variantId, raw) =>
  (
    await db
      .update(inventoryBalances)
      .set({ ...reorderInput.parse(raw), updatedAt: new Date() })
      .where(pair(locationId, variantId))
      .returning()
  )[0] ?? null
export const getStockMovements = () =>
  db.select().from(stockMovements).orderBy(stockMovements.ledgerIndex)
export const getStockMovement = async (id) =>
  (
    await db.select().from(stockMovements).where(eq(stockMovements.id, id))
  )[0] ?? null
export async function createStockMovement(raw, actor) {
  const data = movementInput.parse(raw),
    author = actorId(actor)
  return inventoryTransaction(async (tx) => {
    const result = await applyStockOperation(tx, {
      validate: () => validatePairs(tx, [data.locationId], data.variantId),
      key: `admin:${data.operationId}`,
      kind: data.type,
      actorId: author,
      referenceType: data.referenceType ?? 'manual',
      referenceId: data.referenceId,
      note: data.note,
      movements: [
        {
          locationId: data.locationId,
          variantId: data.variantId,
          type: data.type,
          quantity: data.type === 'issue' ? -data.quantity : data.quantity,
          onHandDelta: data.type === 'issue' ? -data.quantity : data.quantity,
          reservedDelta: 0,
        },
      ],
    })
    return result.movements[0]
  })
}
export async function transferStock(raw, actor) {
  const data = transferInput.parse(raw),
    author = actorId(actor)
  return inventoryTransaction(async (tx) => {
    return applyStockOperation(tx, {
      validate: () =>
        validatePairs(
          tx,
          [data.sourceLocationId, data.targetLocationId],
          data.variantId,
        ),
      key: `admin:${data.operationId}`,
      kind: 'transfer',
      actorId: author,
      note: data.note,
      movements: [
        {
          locationId: data.sourceLocationId,
          variantId: data.variantId,
          type: 'transfer_out',
          quantity: -data.quantity,
          onHandDelta: -data.quantity,
          reservedDelta: 0,
        },
        {
          locationId: data.targetLocationId,
          variantId: data.variantId,
          type: 'transfer_in',
          quantity: data.quantity,
          onHandDelta: data.quantity,
          reservedDelta: 0,
        },
      ],
    })
  })
}
export async function getInventoryOperation(id) {
  return (
    (
      await db
        .select()
        .from(inventoryOperations)
        .where(eq(inventoryOperations.id, z.uuid().parse(id)))
    )[0] ?? null
  )
}
export async function reconcileInventory() {
  // A single statement observes baseline, balance, ledger and reservations at one MVCC snapshot.
  const result = await db.execute(sql`
    select b.location_id as "locationId", b.variant_id as "variantId", b.quantity_on_hand as "actualOnHand", b.quantity_reserved as "actualReserved",
      base.quantity_on_hand + coalesce(m.on_hand,0) as "expectedOnHand", base.quantity_reserved + coalesce(m.reserved,0) as "expectedReserved",
      coalesce(r.reserved,0) as "reservationQuantity", coalesce(m.incomplete,0) as "incompleteMovements",
      (base.location_id is not null and b.quantity_on_hand = base.quantity_on_hand + coalesce(m.on_hand,0)
       and b.quantity_reserved = base.quantity_reserved + coalesce(m.reserved,0) and b.quantity_reserved = coalesce(r.reserved,0) and coalesce(m.incomplete,0) = 0) as "consistent"
    from inventory_balance b left join inventory_baseline base on base.location_id=b.location_id and base.variant_id=b.variant_id
    left join lateral (select sum(on_hand_delta) on_hand, sum(reserved_delta) reserved, count(*) filter(where on_hand_delta is null or reserved_delta is null) incomplete from stock_movement where location_id=b.location_id and variant_id=b.variant_id and ledger_index > base.last_movement_index) m on true
    left join lateral (select sum(quantity) reserved from inventory_reservation where location_id=b.location_id and variant_id=b.variant_id and state='reserved') r on true
    order by b.location_id,b.variant_id
  `)
  return {
    items: result.rows,
    discrepancies: result.rows.filter((row) => !row.consistent).length,
  }
}

export async function reconcileStockBalance(raw, actor) {
  const input = reconcileAdjustmentInput.parse(raw),
    author = actorId(actor)
  return inventoryTransaction(async (tx) => {
    const delta = input.quantityOnHand - input.expectedActualOnHand
    const reservedDelta =
      input.quantityReserved === undefined
        ? 0
        : input.quantityReserved - input.expectedActualReserved
    const result = await applyStockOperation(tx, {
      validate: () => validatePairs(tx, [input.locationId], input.variantId),
      key: `admin:${input.operationId}`,
      kind: 'reconciliation',
      actorId: author,
      referenceType: 'reconciliation',
      note: input.note,
      movements: [
        {
          locationId: input.locationId,
          variantId: input.variantId,
          type: 'adjustment',
          quantity: delta || reservedDelta,
          onHandDelta: delta,
          reservedDelta,
          expectedOnHand: input.expectedActualOnHand,
          ...(input.expectedActualReserved === undefined
            ? {}
            : { expectedReserved: input.expectedActualReserved }),
        },
      ],
    })
    if (result.baselineAfter) return result
    const [actual] = await tx
      .select()
      .from(inventoryBalances)
      .where(pair(input.locationId, input.variantId))
    const [reservations] = await tx
      .select({
        total: sql`coalesce(sum(${inventoryReservations.quantity}),0)::int`,
      })
      .from(inventoryReservations)
      .where(
        and(
          eq(inventoryReservations.locationId, input.locationId),
          eq(inventoryReservations.variantId, input.variantId),
          eq(inventoryReservations.state, 'reserved'),
        ),
      )
    if (actual.quantityReserved !== reservations.total)
      fail(
        'Reserved phải bằng tổng reservation đang giữ; cần đối soát và chỉ định điều chỉnh rõ ràng, không được xóa giữ hàng của đơn.',
      )
    const baselineWhere = and(
      eq(inventoryBaselines.locationId, input.locationId),
      eq(inventoryBaselines.variantId, input.variantId),
    )
    const [baselineBefore] = await tx
      .select()
      .from(inventoryBaselines)
      .where(baselineWhere)
    const [last] = await tx
      .select({
        index: sql`coalesce(max(${stockMovements.ledgerIndex}),0)::bigint`,
      })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.locationId, input.locationId),
          eq(stockMovements.variantId, input.variantId),
        ),
      )
    const [baselineAfter] = await tx
      .update(inventoryBaselines)
      .set({
        quantityOnHand: actual.quantityOnHand,
        quantityReserved: actual.quantityReserved,
        lastMovementIndex: Number(last.index),
        createdAt: new Date(),
      })
      .where(baselineWhere)
      .returning()
    const audited = { ...result, baselineBefore, baselineAfter }
    await tx
      .update(inventoryOperations)
      .set({ result: audited })
      .where(eq(inventoryOperations.id, result.operationId))
    return audited
  })
}
