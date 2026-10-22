import {activeOwner} from './account-state.js'
import { allocateOrder } from '../lib/orders/refund-allocation.js'
import { orderAllocations, refunds } from '../database/schema.js'
import { enqueue } from './fulfillment.js'
import { listOrderPage } from './order-list.js'
import { productVisible } from './public-catalog.js'
import {
  inventoryTransaction,
  reserveOrderStock,
  settleOrderStock,
} from './stock-ledger.js'
import { and, asc, eq, inArray, isNotNull, lt, ne, or, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '../database/index.js'
import {
  addresses,
  carts,
  cartItems,
  checkoutSessions,
  inventoryBalances,
  inventoryLocations,
  orderAddresses,
  orderItems,
  orders,
  orderStatusHistories,
  payments,
  promotionCodes,
  promotionUsages,
  promotions,
  products,
  productVariants,
  user,
} from '../database/schema.js'
import {
  assertSettlement,
  checkoutError,
  checkoutInput,
  fingerprint,
  placeInput,
  shippingPrices,
  vndAmount,
} from '../lib/checkout/contracts.js'
import {
  assertGateway,
  createGatewayPayment,
  gatewayRequestId,
  queryGatewayPayment,
  settlementAmount,
} from './payment-gateways.js'

const first = (rows) => rows[0]
async function ownedSession(tx, orderId, userId, lock = false) {
  let query = tx
    .select()
    .from(checkoutSessions)
    .where(
      and(
        eq(checkoutSessions.orderId, orderId),
        eq(checkoutSessions.userId, userId),
      ),
    )
  if (lock) query = query.for('update')
  const session = first(await query)
  if (!session) throw checkoutError(404, 'Không tìm thấy đơn hàng.')
  return session
}
async function pricedCart(tx, userId, raw, reserve = false) {
  const input = checkoutInput.parse(raw)
  assertGateway(input.provider)
  const address = first(
    await tx
      .select()
      .from(addresses)
      .where(
        and(eq(addresses.id, input.addressId), eq(addresses.userId, userId)),
      ),
  )
  if (!address)
    throw checkoutError(
      403,
      'Vui lòng chọn địa chỉ đã lưu thuộc tài khoản của bạn.',
    )
  const ids = input.items.map((item) => item.variantId).sort()
  const variants = await tx
    .select({ variant: productVariants, product: products })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(inArray(productVariants.id, ids), productVisible()))
  const byId = new Map(variants.map((row) => [row.variant.id, row]))
  if (reserve)
    await tx
      .select({ id: inventoryLocations.id })
      .from(inventoryLocations)
      .where(
        and(
          eq(inventoryLocations.isActive, true),
          sql`exists(select 1 from inventory_balance ib where ib.location_id=${inventoryLocations.id} and ib.variant_id in (${sql.join(
            ids.map((id) => sql`${id}::uuid`),
            sql`, `,
          )}))`,
        ),
      )
      .orderBy(asc(inventoryLocations.id))
      .for('share')
  let stockQuery = tx
    .select({ balance: inventoryBalances })
    .from(inventoryBalances)
    .innerJoin(
      inventoryLocations,
      eq(inventoryLocations.id, inventoryBalances.locationId),
    )
    .where(
      and(
        inArray(inventoryBalances.variantId, ids),
        eq(inventoryLocations.isActive, true),
      ),
    )
    .orderBy(
      asc(inventoryBalances.locationId),
      asc(inventoryBalances.variantId),
    )
  if (reserve) stockQuery = stockQuery.for('update', { of: inventoryBalances })
  const stocks = (await stockQuery).map((row) => row.balance)
  const reservations = []
  const lines = []
  for (const item of [...input.items].sort((a, b) =>
    a.variantId.localeCompare(b.variantId),
  )) {
    const row = byId.get(item.variantId)
    if (
      !row ||
      row.product.status !== 'active' ||
      row.variant.status !== 'active'
    )
      throw checkoutError(
        409,
        'Sản phẩm không còn được bán. Vui lòng cập nhật giỏ hàng.',
      )
    const price = vndAmount(row.variant.price)
    let remaining = item.quantity
    for (const stock of stocks.filter(
      (balance) => balance.variantId === item.variantId,
    )) {
      const quantity = Math.min(
        remaining,
        stock.quantityOnHand - stock.quantityReserved,
      )
      if (quantity > 0) {
        reservations.push({
          variantId: item.variantId,
          locationId: stock.locationId,
          quantity,
        })
        remaining -= quantity
      }
      if (!remaining) break
    }
    if (remaining)
      throw checkoutError(409, `Không đủ tồn kho cho ${row.product.name}.`)
    lines.push({
      variantId: item.variantId,
      sku: row.variant.sku,
      productName: row.product.name,
      variantName: row.variant.name,
      quantity: item.quantity,
      unitPrice: String(price),
      total: String(price * item.quantity),
    })
  }
  const subtotal = lines.reduce((sum, item) => sum + Number(item.total), 0)
  const shipping = shippingPrices[input.shipping]
  let discount = 0
  let voucher = null
  if (input.voucherCode) {
    let query = tx
      .select({ code: promotionCodes, promotion: promotions })
      .from(promotionCodes)
      .innerJoin(promotions, eq(promotions.id, promotionCodes.promotionId))
      .where(eq(promotionCodes.code, input.voucherCode))
    if (reserve)
      query = query.for('update', { of: [promotionCodes, promotions] })
    const row = first(await query)
    if (!row) throw checkoutError(409, 'Mã giảm giá không tồn tại.')
    const { code, promotion } = row
    const now = new Date()
    const usages = await tx
      .select({ id: promotionUsages.id })
      .from(promotionUsages)
      .where(
        and(
          eq(promotionUsages.promotionCodeId, code.id),
          eq(promotionUsages.userId, userId),
        ),
      )
    if (
      !promotion.isActive ||
      new Date(promotion.startsAt) > now ||
      new Date(promotion.endsAt) <= now
    )
      throw checkoutError(409, 'Mã giảm giá chưa có hiệu lực hoặc đã hết hạn.')
    if (
      (code.usageLimit !== null && code.usedCount >= code.usageLimit) ||
      usages.length >= code.usagePerUser
    )
      throw checkoutError(409, 'Mã giảm giá đã hết lượt sử dụng.')
    if (subtotal < Number(promotion.minimumOrderValue))
      throw checkoutError(
        409,
        'Đơn hàng chưa đạt giá trị tối thiểu của mã giảm giá.',
      )
    discount =
      promotion.discountType === 'percentage'
        ? Math.floor((subtotal * Number(promotion.discountValue)) / 100)
        : Math.floor(Number(promotion.discountValue))
    if (promotion.maximumDiscount !== null)
      discount = Math.min(
        discount,
        Math.floor(Number(promotion.maximumDiscount)),
      )
    discount = Math.max(0, Math.min(subtotal, discount))
    voucher = { id: code.id, code: code.code, promotionId: promotion.id }
  }
  const total = subtotal - discount + shipping
  if (!Number.isSafeInteger(total) || total <= 0 || total > 999999999999)
    throw checkoutError(400, 'Tổng tiền không hợp lệ.')
  return {
    input,
    address,
    lines,
    reservations,
    subtotal,
    shipping,
    total,
    discount,
    voucher,
  }
}
function quoteSummary(priced) {
  const converted = settlementAmount(priced.input.provider, priced.total)
  const summary = {
    items: priced.lines,
    subtotal: priced.subtotal,
    shipping: priced.shipping,
    discount: priced.discount,
    voucher: priced.voucher,
    grandTotal: priced.total,
    currency: 'VND',
    provider: priced.input.provider,
    providerAmount: converted.amount,
    providerCurrency: converted.currency,
    exchangeRate: converted.exchangeRate,
  }
  return {
    ...summary,
    quoteToken: fingerprint({
      ...summary,
      addressId: priced.address.id,
      addressUpdatedAt: priced.address.updatedAt?.toISOString(),
      note: priced.input.note,
    }),
  }
}
export async function quoteCheckout(userId, input) {
  return quoteSummary(await pricedCart(db, userId, input))
}
export async function placeCheckout(userId, raw) {
  const { requestKey, quoteToken, checkout } = placeInput.parse(raw)
  assertGateway(checkout.provider)
  const digest = fingerprint(checkout)
  const id = await inventoryTransaction(async (tx) => {
    // Serializes creation for this account; retrying a key never creates another order.
    await activeOwner(tx,userId)
    const existing = first(
      await tx
        .select()
        .from(checkoutSessions)
        .where(
          and(
            eq(checkoutSessions.userId, userId),
            eq(checkoutSessions.requestKey, requestKey),
          ),
        ),
    )
    if (existing) {
      if (existing.fingerprint !== digest)
        throw checkoutError(409, 'Mã yêu cầu đã được dùng cho nội dung khác.')
      return existing.orderId
    }
    const priced = await pricedCart(tx, userId, checkout, true)
    if (quoteToken !== quoteSummary(priced).quoteToken)
      throw checkoutError(
        409,
        'Giá, địa chỉ hoặc tỷ giá đã thay đổi. Vui lòng kiểm tra lại đơn hàng.',
      )
    const amount = settlementAmount(checkout.provider, priced.total)
    const order = first(
      await tx
        .insert(orders)
        .values({
          code: `WKL-${randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`,
          userId,
          subtotal: String(priced.subtotal),
          shippingTotal: String(priced.shipping),
          discountTotal: String(priced.discount),
          grandTotal: String(priced.total),
          note: checkout.note,
          orderStatus: checkout.provider === 'cod' ? 'confirmed' : 'pending',
        })
        .returning(),
    )
    if (priced.voucher) {
      await tx
        .update(promotionCodes)
        .set({ usedCount: sql`${promotionCodes.usedCount} + 1` })
        .where(eq(promotionCodes.id, priced.voucher.id))
      await tx.insert(promotionUsages).values({
        promotionCodeId: priced.voucher.id,
        userId,
        orderId: order.id,
      })
    }
    const {
      recipientName,
      phone,
      addressLine,
      ward,
      district,
      province,
      country,
    } = priced.address
    await tx.insert(orderAddresses).values({
      orderId: order.id,
      recipientName,
      phone,
      addressLine,
      ward,
      district,
      province,
      country,
    })
    const savedItems=await tx
      .insert(orderItems)
      .values(priced.lines.map((line) => ({ ...line, orderId: order.id }))).returning()
    await tx.insert(orderAllocations).values(allocateOrder(order,savedItems))
    await reserveOrderStock(tx, order.id, priced.reservations, userId)
    await tx.insert(payments).values({
      orderId: order.id,
      provider: checkout.provider,
      method: checkout.provider === 'cod' ? 'cod' : 'online',
      amount: String(priced.total),
      metadata: {
        currency: amount.currency,
        providerAmount: amount.amount,
        exchangeRate: amount.exchangeRate,
      },
    })
    const session = {
      id: randomUUID(),
      orderId: order.id,
      userId,
      requestKey,
      fingerprint: digest,
      provider: checkout.provider,
      providerAmount: amount.amount,
      currency: amount.currency,
      exchangeRate: amount.exchangeRate,
      reservations: priced.reservations,
      cartSnapshot: (
        await tx
          .select({ id: cartItems.id, variantId: cartItems.variantId })
          .from(cartItems)
          .innerJoin(carts, eq(carts.id, cartItems.cartId))
          .where(and(eq(carts.userId, userId), eq(carts.status, 'active')))
      ).flatMap((item) => {
        const line = priced.lines.find(
          (line) => line.variantId === item.variantId,
        )
        return line ? [{ id: item.id, quantity: line.quantity }] : []
      }),
      expiresAt: new Date(Date.now() + 60 * 60000),
      state: checkout.provider === 'cod' ? 'ready' : 'created',
      createdAt: new Date(),
    }
    if (['momo', 'zalopay'].includes(session.provider))
      session.providerOrderId = gatewayRequestId(session)
    await tx.insert(checkoutSessions).values(session)
    if (checkout.provider === 'cod') await clearPurchasedCart(tx, session)
    await tx.insert(orderStatusHistories).values({
      orderId: order.id,
      status: order.orderStatus,
      note: 'Khách hàng đặt đơn.',
    })
    return order.id
  })
  return getCustomerOrder(userId, id)
}
export async function getCustomerOrder(userId, orderId) {
  const order = first(
    await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId))),
  )
  if (!order) throw checkoutError(404, 'Không tìm thấy đơn hàng.')
  const session = first(
    await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.orderId, orderId)),
  )
  if (session && session.userId !== userId)
    throw checkoutError(404, 'Không tìm thấy đơn hàng.')
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
  const address = first(
    await db
      .select()
      .from(orderAddresses)
      .where(eq(orderAddresses.orderId, orderId)),
  )
  const resolvedLate=session?.state==='paid_late'?first(await db.select({id:refunds.id}).from(refunds).where(and(eq(refunds.orderId,orderId),eq(refunds.purpose,'paid_cancellation'),eq(refunds.state,'succeeded')))):null
  return {
    ...order,
    managed: Boolean(session),
    items,
    address,
    payment: !session
      ? {
          provider: 'other',
          state: order.paymentStatus === 'paid' ? 'paid' : 'legacy',
          amount: order.grandTotal,
          currency: 'VND',
          exchangeRate: null,
          requiresSupport: false,
          url: null,
          expiresAt: null,
        }
      : {
          provider: session.provider,
          state: session.state,
          amount: session.providerAmount,
          currency: session.currency,
          exchangeRate: session.exchangeRate,
          requiresSupport: session.state === 'paid_late' && !resolvedLate,
          url: session.state === 'ready' ? session.paymentUrl : null,
          expiresAt: session.expiresAt,
        },
  }
}
export const listCustomerOrders = (userId, query) => {
  if (!userId) throw checkoutError(401, 'Vui lòng đăng nhập.')
  return listOrderPage(query, userId)
}
export async function initiatePayment(
  userId,
  orderId,
  provider,
  { allowExpiredRecovery = false } = {},
) {
  const session = await db.transaction(async (tx) => {
    const session = await ownedSession(tx, orderId, userId, true)
    if (provider && provider !== session.provider)
      throw checkoutError(409, 'Phương thức thanh toán không khớp đơn hàng.')
    if (
      session.provider === 'cod' ||
      ['paid', 'paid_late'].includes(session.state) ||
      (session.state === 'ready' && session.paymentUrl)
    )
      return session
    if (['failed', 'cancelled'].includes(session.state))
      throw checkoutError(409, 'Đơn đã đóng. Vui lòng đặt đơn mới.')
    if (
      new Date(session.expiresAt) <= new Date() &&
      !(allowExpiredRecovery && session.state === 'creating')
    )
      throw checkoutError(
        409,
        'Phiên thanh toán đã hết hạn. Vui lòng kiểm tra trạng thái đơn.',
      )
    if (
      session.state === 'creating' &&
      Date.now() - new Date(session.updatedAt).getTime() < 60000
    )
      throw checkoutError(
        409,
        'Đang tạo phiên thanh toán. Vui lòng đợi rồi kiểm tra trạng thái.',
      )
    return first(
      await tx
        .update(checkoutSessions)
        .set({ state: 'creating', updatedAt: new Date() })
        .where(eq(checkoutSessions.id, session.id))
        .returning(),
    )
  })
  if (
    session.provider === 'cod' ||
    ['paid', 'paid_late'].includes(session.state) ||
    session.paymentUrl
  )
    return getCustomerOrder(userId, orderId)
  const order = first(
    await db.select().from(orders).where(eq(orders.id, orderId)),
  )
  // Preserve uncertain attempts on timeout. A retry uses the same upstream idempotency key.
  const result = await createGatewayPayment(session, order)
  await db
    .update(checkoutSessions)
    .set({
      providerOrderId: result.providerId,
      paymentUrl: result.url,
      state: 'ready',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(checkoutSessions.id, session.id),
        eq(checkoutSessions.state, 'creating'),
      ),
    )
  return getCustomerOrder(userId, orderId)
}

async function lockBuyer(tx, userId) {
  await tx
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .for('update')
}
export async function clearPurchasedCart(tx, session) {
  if (session.cartClearedAt) return
  for (const item of session.cartSnapshot ?? []) {
    const row = first(
      await tx
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, item.id))
        .for('update'),
    )
    if (!row) continue
    if (row.quantity <= item.quantity)
      await tx.delete(cartItems).where(eq(cartItems.id, row.id))
    else
      await tx
        .update(cartItems)
        .set({ quantity: row.quantity - item.quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, row.id))
  }
  await tx
    .update(checkoutSessions)
    .set({ cartClearedAt: new Date() })
    .where(eq(checkoutSessions.id, session.id))
}
export async function restoreVoucher(tx, orderId) {
  const usages = await tx
    .delete(promotionUsages)
    .where(eq(promotionUsages.orderId, orderId))
    .returning()
  for (const usage of usages.sort((a, b) =>
    a.promotionCodeId.localeCompare(b.promotionCodeId),
  ))
    await tx
      .update(promotionCodes)
      .set({ usedCount: sql`greatest(0, ${promotionCodes.usedCount} - 1)` })
      .where(eq(promotionCodes.id, usage.promotionCodeId))
}
async function releaseReservations(tx, session, actorId = null) {
  await settleOrderStock(tx, session, 'released', actorId)
}

export async function applyGatewayResult(sessionId, result, transaction) {
  const apply = async (tx) => {
    const target = first(
      await tx
        .select()
        .from(checkoutSessions)
        .where(eq(checkoutSessions.id, sessionId)),
    )
    if (!target) throw checkoutError(404, 'Không tìm thấy giao dịch.')
    await lockBuyer(tx, target.userId)
    const session = first(
      await tx
        .select()
        .from(checkoutSessions)
        .where(eq(checkoutSessions.id, sessionId))
        .for('update'),
    )
    if (!session) throw checkoutError(404, 'Không tìm thấy giao dịch.')
    if (session.state === 'paid') {
      await clearPurchasedCart(tx, session)
      return
    }
    if (session.state === 'paid_late') return
    if (result.state === 'pending') {
      await tx
        .update(checkoutSessions)
        .set({ updatedAt: new Date() })
        .where(eq(checkoutSessions.id, session.id))
      return
    }
    assertSettlement(session, result)
    if (['failed', 'cancelled'].includes(session.state)) {
      if (result.state === 'paid') {
        await enqueue(tx,`payment-late:${session.id}`,'order_email',{orderId:session.orderId,event:'payment_needs_review'})
        await tx
          .update(checkoutSessions)
          .set({ state: 'paid_late', paymentUrl: null, updatedAt: new Date() })
          .where(eq(checkoutSessions.id, session.id))
        await tx
          .update(payments)
          .set({
            status: 'completed',
            transactionId: result.transactionId,
            paidAt: new Date(),
            metadata: sql`${payments.metadata} || ${JSON.stringify({ requiresRefund: true, reason: 'payment_after_close' })}::jsonb`,
            updatedAt: new Date(),
          })
          .where(eq(payments.orderId, session.orderId))
        await tx
          .update(orders)
          .set({ paymentStatus: 'paid', updatedAt: new Date() })
          .where(eq(orders.id, session.orderId))
        await tx.insert(orderStatusHistories).values({
          orderId: session.orderId,
          status: 'cancelled',
          note: 'Thanh toán đến muộn sau khi đơn đã đóng. Cần đối soát hoàn tiền; không giao hàng.',
        })
      }
      return
    }
    if (result.state === 'paid') {
      await enqueue(tx,`payment-email:${session.id}`,'order_email',{orderId:session.orderId,event:'payment_confirmed'})
      await clearPurchasedCart(tx, session)
      await tx
        .update(checkoutSessions)
        .set({ state: 'paid', paymentUrl: null, updatedAt: new Date() })
        .where(eq(checkoutSessions.id, session.id))
      await tx
        .update(payments)
        .set({
          status: 'completed',
          transactionId: result.transactionId || session.providerOrderId,
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.orderId, session.orderId))
      await tx
        .update(orders)
        .set({
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, session.orderId))
      await tx.insert(orderStatusHistories).values({
        orderId: session.orderId,
        status: 'confirmed',
        note: 'Cổng thanh toán đã xác nhận số tiền và loại tiền.',
      })
    } else {
      await releaseReservations(tx, session)
      await restoreVoucher(tx, session.orderId)
      await tx
        .update(checkoutSessions)
        .set({ state: 'failed', paymentUrl: null, updatedAt: new Date() })
        .where(eq(checkoutSessions.id, session.id))
      await tx
        .update(payments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(payments.orderId, session.orderId))
      await tx
        .update(orders)
        .set({
          paymentStatus: 'failed',
          orderStatus: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, session.orderId))
      await tx.insert(orderStatusHistories).values({
        orderId: session.orderId,
        status: 'cancelled',
        note: 'Giao dịch thất bại hoặc hết hạn đã được xác minh.',
      })
    }
  }
  return transaction ? apply(transaction) : inventoryTransaction(apply)
}
export async function refreshPayment(
  userId,
  orderId,
  { capture = false, expire = false, verifyClosed = false } = {},
) {
  // Provider I/O is outside the transaction. applyGatewayResult locks and rechecks
  // current state, including payment arriving after cancellation.
  const session = await ownedSession(db, orderId, userId)
  if (session.provider !== 'cod' && !['paid','paid_late'].includes(session.state) &&
      (verifyClosed || !['failed','cancelled'].includes(session.state)) && session.providerOrderId) {
    const result = await queryGatewayPayment(session, { capture, expire })
    await applyGatewayResult(session.id, result)
  }
  return getCustomerOrder(userId, orderId)
}
export async function handleGatewayNotification(provider, providerId) {
  const session = first(
    await db
      .select()
      .from(checkoutSessions)
      .where(
        and(
          eq(checkoutSessions.provider, provider),
          eq(checkoutSessions.providerOrderId, providerId),
        ),
      ),
  )
  if (!session) throw checkoutError(404, 'Không tìm thấy giao dịch.')
  // Never trust status or amount sent by a browser or webhook alone; query the gateway.
  return refreshPayment(session.userId, session.orderId, { verifyClosed: true })
}
export async function cancelCheckout(userId, orderId, actorId = userId) {
  let session = await ownedSession(db, orderId, userId)
  if (['paid', 'paid_late'].includes(session.state))
    throw checkoutError(
      409,
      'Đơn đã thanh toán. Vui lòng liên hệ hỗ trợ để hoàn tiền.',
    )
  if (
    session.provider !== 'cod' &&
    session.providerOrderId &&
    !['failed', 'cancelled'].includes(session.state)
  ) {
    await refreshPayment(userId, orderId, {
      expire:
        ['stripe', 'paypal'].includes(session.provider) ||
        new Date(session.expiresAt) <= new Date(),
    })
    session = await ownedSession(db, orderId, userId)
    if (!['failed', 'cancelled'].includes(session.state))
      throw checkoutError(
        409,
        'Cổng thanh toán chưa xác nhận giao dịch đã đóng. Đơn vẫn được giữ để tránh mất giao dịch.',
      )
    return getCustomerOrder(userId, orderId)
  }
  await inventoryTransaction(async (tx) => {
    await lockBuyer(tx, userId)
    session = await ownedSession(tx, orderId, userId, true)
    if (['cancelled', 'failed'].includes(session.state)) return
    if (['paid', 'paid_late'].includes(session.state))
      throw checkoutError(409, 'Đơn đã thanh toán.')
    const order = first(
      await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for('update'),
    )
    if (!['pending', 'confirmed'].includes(order.orderStatus))
      throw checkoutError(409, 'Đơn đang được xử lý, không thể tự hủy.')
    if (session.provider !== 'cod' && session.state === 'creating')
      throw checkoutError(
        409,
        'Đang xác minh phiên thanh toán. Vui lòng thử lại sau.',
      )
    await releaseReservations(tx, session, actorId)
    await restoreVoucher(tx, session.orderId)
    await tx
      .update(checkoutSessions)
      .set({ state: 'cancelled', updatedAt: new Date() })
      .where(eq(checkoutSessions.id, session.id))
    await tx
      .update(orders)
      .set({ orderStatus: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.id, orderId))
    await tx.insert(orderStatusHistories).values({
      orderId,
      status: 'cancelled',
      note: 'Khách hàng hủy đơn chưa thanh toán.',
    })
  })
  return getCustomerOrder(userId, orderId)
}
export async function reconcileExpiredCheckouts({limit=100,deadline=Infinity}={}) {
  const sessions = await db
    .select()
    .from(checkoutSessions)
    .where(
      and(
        inArray(checkoutSessions.state, ['created', 'creating', 'ready']),
        ne(checkoutSessions.provider, 'cod'),
        or(
          isNotNull(checkoutSessions.providerOrderId),
          lt(checkoutSessions.expiresAt, new Date()),
          and(
            eq(checkoutSessions.state, 'creating'),
            lt(checkoutSessions.updatedAt, new Date(Date.now() - 60000)),
          ),
        ),
      ),
    )
    .orderBy(asc(checkoutSessions.updatedAt))
    .limit(limit)
  const results = []
  for (const session of sessions) {
    if(Date.now()>=deadline-35000) break
    if (session.provider === 'cod') continue
    try {
      if (session.providerOrderId)
        await refreshPayment(session.userId, session.orderId, {
          expire: new Date(session.expiresAt) <= new Date(),
          capture: new Date(session.expiresAt) > new Date(),
        })
      else if (session.state !== 'creating')
        await cancelCheckout(session.userId, session.orderId)
      else {
        // Recover Stripe/PayPal create timeouts using the same upstream idempotency key.
        await initiatePayment(session.userId, session.orderId, undefined, {
          allowExpiredRecovery: true,
        })
      }
      results.push({ orderId: session.orderId, ok: true })
    } catch (error) {
      await db.update(checkoutSessions).set({updatedAt:new Date()}).where(eq(checkoutSessions.id,session.id))
      results.push({
        orderId: session.orderId,
        ok: false,
        status: error.status ?? 500,
      })
    }
  }
  return results
}

// Called under the same transaction as the admin order transition.
export async function finishCheckoutOrder(tx, orderId, nextStatus) {
  const session = first(
    await tx
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.orderId, orderId))
      .for('update'),
  )
  if (!session) return
  if (nextStatus === 'cancelled') {
    if (session.state !== 'cancelled' && session.state !== 'failed')
      throw checkoutError(
        409,
        'Hủy đơn qua luồng checkout để kiểm tra giao dịch và giải phóng tồn kho.',
      )
    return
  }
  if (
    ['processing', 'completed'].includes(nextStatus) &&
    session.provider !== 'cod' &&
    session.state !== 'paid'
  )
    throw checkoutError(409, 'Đơn trực tuyến chưa thanh toán.')
  if (['completed','returned'].includes(nextStatus)) throw checkoutError(409, 'Giao/hoàn hàng phải qua hồ sơ vận chuyển/trả hàng.')
}
