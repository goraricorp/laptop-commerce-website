import { createHash } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../database/index.js'
import {
  checkoutSessions,
  inventoryBalances,
  inventoryBaselines,
  inventoryOperations,
  inventoryReservations,
  stockMovements,
} from '../database/schema.js'
const error = (message) => Object.assign(new Error(message), { status: 409 })
const pairWhere = (table, pair) =>
  and(
    eq(table.locationId, pair.locationId),
    eq(table.variantId, pair.variantId),
  )
const pairKey = (pair) => `${pair.locationId}:${pair.variantId}`
export const sortPairs = (pairs) =>
  [...new Map(pairs.map((pair) => [pairKey(pair), pair])).values()].sort(
    (a, b) => pairKey(a).localeCompare(pairKey(b)),
  )
export async function inventoryTransaction(action, database = db) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await database.transaction(action)
    } catch (err) {
      if (
        attempt >= 2 ||
        !['40001', '40P01'].includes(err.cause?.code ?? err.code)
      )
        throw err
    }
  }
}
export async function lockBalances(tx, pairs) {
  const balances = new Map()
  for (const pair of sortPairs(pairs)) {
    await tx
      .insert(inventoryBalances)
      .values({ locationId: pair.locationId, variantId: pair.variantId })
      .onConflictDoNothing()
    const [row] = await tx
      .select()
      .from(inventoryBalances)
      .where(pairWhere(inventoryBalances, pair))
      .for('update')
    balances.set(pairKey(pair), row)
    const [last] = await tx
      .select({
        index: sql`coalesce(max(${stockMovements.ledgerIndex}),0)::bigint`,
      })
      .from(stockMovements)
      .where(pairWhere(stockMovements, pair))
    await tx
      .insert(inventoryBaselines)
      .values({
        locationId: pair.locationId,
        variantId: pair.variantId,
        quantityOnHand: row.quantityOnHand,
        quantityReserved: row.quantityReserved,
        lastMovementIndex: Number(last.index),
      })
      .onConflictDoNothing()
  }
  return balances
}
async function claimOperation(
  tx,
  { key, kind, actorId = null, referenceId = null, payload },
) {
  const hash = createHash('sha256')
    .update(JSON.stringify({ kind, actorId, referenceId, payload }))
    .digest('hex')
  const [inserted] = await tx
    .insert(inventoryOperations)
    .values({ key, kind, actorId, referenceId, requestHash: hash })
    .onConflictDoNothing()
    .returning()
  if (inserted) return { operation: inserted }
  const [existing] = await tx
    .select()
    .from(inventoryOperations)
    .where(eq(inventoryOperations.key, key))
    .for('update')
  if (existing.requestHash !== hash)
    throw error('Operation ID đã được dùng với dữ liệu khác.')
  if (!existing.result) throw error('Operation chưa có kết quả hợp lệ.')
  return { replay: existing.result }
}
// Must be called inside the transaction containing the owning business state change.
export async function applyStockOperation(tx, command) {
  const movements = [...command.movements].sort((a, b) =>
    pairKey(a).localeCompare(pairKey(b)),
  )
  const claim = await claimOperation(tx, {
    ...command,
    payload: {
      movements,
      note: command.note ?? null,
      referenceType: command.referenceType ?? null,
    },
  })
  if (claim.replay) return claim.replay
  await command.validate?.()
  const balances = await lockBalances(tx, movements)
  const results = []
  for (const move of movements) {
    const before = balances.get(pairKey(move))
    if (
      move.expectedOnHand !== undefined &&
      before.quantityOnHand !== move.expectedOnHand
    )
      throw error('Tồn kho đã đổi sau lần đối soát; hãy tải báo cáo mới.')
    if (
      move.expectedReserved !== undefined &&
      before.quantityReserved !== move.expectedReserved
    )
      throw error('Số giữ chỗ đã đổi sau lần đối soát; hãy tải báo cáo mới.')
    if (move.quantity === 0) continue
    const onHand = before.quantityOnHand + move.onHandDelta
    const reserved = before.quantityReserved + move.reservedDelta
    if (
      !Number.isSafeInteger(onHand) ||
      !Number.isSafeInteger(reserved) ||
      onHand < 0 ||
      reserved < 0 ||
      reserved > onHand ||
      onHand > 2147483647
    )
      throw error(
        'Số lượng xuất/chuyển vượt tồn khả dụng hoặc giữ chỗ không hợp lệ.',
      )
    const [after] = await tx
      .update(inventoryBalances)
      .set({
        quantityOnHand: onHand,
        quantityReserved: reserved,
        updatedAt: new Date(),
      })
      .where(
        and(
          pairWhere(inventoryBalances, move),
          eq(inventoryBalances.quantityOnHand, before.quantityOnHand),
          eq(inventoryBalances.quantityReserved, before.quantityReserved),
        ),
      )
      .returning()
    if (!after) throw error('Tồn kho đã thay đổi; vui lòng tải lại.')
    const [row] = await tx
      .insert(stockMovements)
      .values({
        locationId: move.locationId,
        variantId: move.variantId,
        type: move.type,
        quantity: move.quantity,
        onHandDelta: move.onHandDelta,
        reservedDelta: move.reservedDelta,
        onHandBefore: before.quantityOnHand,
        onHandAfter: onHand,
        reservedBefore: before.quantityReserved,
        reservedAfter: reserved,
        operationId: claim.operation.id,
        actorId: command.actorId,
        referenceType: command.referenceType,
        referenceId: command.referenceId,
        note: command.note,
      })
      .returning()
    balances.set(pairKey(move), after)
    results.push(row)
  }
  const result = { operationId: claim.operation.id, movements: results }
  await tx
    .update(inventoryOperations)
    .set({ result })
    .where(eq(inventoryOperations.id, claim.operation.id))
  return result
}
export async function reserveOrderStock(tx, orderId, reservations, actorId) {
  const moves = sortPairs(reservations).map((row) => ({
    ...row,
    type: 'reservation',
    onHandDelta: 0,
    reservedDelta: row.quantity,
  }))
  const result = await applyStockOperation(tx, {
    key: `order:${orderId}:reserve`,
    kind: 'reservation',
    referenceType: 'order',
    referenceId: orderId,
    actorId,
    movements: moves,
  })
  for (const row of moves)
    await tx
      .insert(inventoryReservations)
      .values({
        orderId,
        locationId: row.locationId,
        variantId: row.variantId,
        quantity: row.quantity,
      })
      .onConflictDoNothing()
  return result
}
export async function settleOrderStock(
  tx,
  session,
  state,
  actorId = session.userId,
) {
  await tx
    .select({ id: checkoutSessions.id })
    .from(checkoutSessions)
    .where(eq(checkoutSessions.orderId, session.orderId))
    .for('update')
  const reservations = await tx
    .select()
    .from(inventoryReservations)
    .where(eq(inventoryReservations.orderId, session.orderId))
  if (!reservations.length && session.reservations.length)
    throw error(
      'Đơn chưa có reservation chuẩn hóa; cần chạy migration Phase 1.',
    )
  const pending = reservations.filter((row) => row.state === 'reserved')
  if (!pending.length) return
  const moves = pending.map((row) => ({
    locationId: row.locationId,
    variantId: row.variantId,
    type: state === 'issued' ? 'issue' : 'release',
    quantity: -row.quantity,
    onHandDelta: state === 'issued' ? -row.quantity : 0,
    reservedDelta: -row.quantity,
  }))
  await applyStockOperation(tx, {
    key: `order:${session.orderId}:${state}`,
    kind: state,
    referenceType: 'order',
    referenceId: session.orderId,
    actorId,
    movements: moves,
  })
  await tx
    .update(inventoryReservations)
    .set({ state, updatedAt: new Date() })
    .where(
      and(
        eq(inventoryReservations.orderId, session.orderId),
        eq(inventoryReservations.state, 'reserved'),
      ),
    )
}
