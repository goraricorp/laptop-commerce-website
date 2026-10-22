import process from 'node:process'
import { randomUUID } from 'node:crypto'
import { applyStockOperation } from '../services/stock-ledger.js'
import { and, eq } from 'drizzle-orm'

import { db, pool } from './index.js'
import {
  addresses, attributeValues, attributes, brands, cartItems, carts, categories,
  conversationParticipants, conversations, inventoryBalances, inventoryLocations,
  messageAttachments, messages, orderAddresses, orderItems, orderStatusHistories,
  orders, payments, productContentSections, productMedia, productReviews,
  productVariants, products, promotionCodes, promotionUsages, promotions, shipments,
  variantAttributeValues,
} from './schema.js'

const RECORD_COUNT = 50
const numbers = Array.from({ length: RECORD_COUNT }, (_, index) => index + 1)
const money = (value) => String(value)

async function seed() {
  const suffix = Date.now().toString(36)
  const now = new Date()
  const nextYear = new Date(now.getTime() + 365 * 86400000)

  const result = await db.transaction(async (tx) => {
    const categoryRows = await tx.insert(categories).values(numbers.map((number) => ({
      name: `Danh mục ${number}`, slug: `danh-muc-${number}-${suffix}`,
      description: `Danh mục thiết bị công nghệ số ${number}`, position: number,
    }))).returning()

    const brandRows = await tx.insert(brands).values(numbers.map((number) => ({
      name: `Thương hiệu ${number} ${suffix}`, slug: `thuong-hieu-${number}-${suffix}`,
      logoUrl: `https://picsum.photos/seed/brand-${number}-${suffix}/400/200`,
    }))).returning()

    const attributeRows = await tx.insert(attributes).values(numbers.map((number) => ({
      name: `Thuộc tính ${number} ${suffix}`, code: `attribute-${number}-${suffix}`,
      displayType: number % 5 === 0 ? 'color' : 'text', position: number,
    }))).returning()

    const attributeValueRows = await tx.insert(attributeValues).values(numbers.map((number, index) => ({
      attributeId: attributeRows[index].id, value: `Giá trị ${number}`, code: `value-${number}-${suffix}`,
      metadata: number % 5 === 0 ? { hex: '#111827' } : {}, position: number,
    }))).returning()

    const productRows = await tx.insert(products).values(numbers.map((number, index) => ({
      categoryId: categoryRows[index].id, brandId: brandRows[index].id,
      name: `Sản phẩm công nghệ ${number}`, slug: `san-pham-${number}-${suffix}`,
      summary: `Sản phẩm mẫu đa ngành hàng số ${number}`,
      productType: ['laptop', 'component', 'accessory', 'monitor'][number % 4],
    }))).returning()

    const variantRows = await tx.insert(productVariants).values(numbers.map((number, index) => ({
      productId: productRows[index].id, sku: `SKU-${suffix}-${String(number).padStart(3, '0')}`,
      name: `Phiên bản ${number}`, barcode: `893${Date.now()}${String(number).padStart(3, '0')}`,
      price: money(1000000 + number * 375000), compareAtPrice: money(1200000 + number * 400000),
      costPrice: money(800000 + number * 300000), weightGrams: 500 + number * 25,
    }))).returning()

    const mediaRows = await tx.insert(productMedia).values(numbers.map((number, index) => ({
      productId: productRows[index].id, variantId: variantRows[index].id,
      url: `https://picsum.photos/seed/product-${number}-${suffix}/1200/900`,
      alt: productRows[index].name, isPrimary: true,
    }))).returning()

    const contentRows = await tx.insert(productContentSections).values(numbers.map((number, index) => ({
      productId: productRows[index].id, title: `Thông tin nổi bật ${number}`,
      content: `Nội dung chi tiết của sản phẩm mẫu số ${number}.`, position: 1,
    }))).returning()

    const variantAttributeRows = await tx.insert(variantAttributeValues).values(numbers.map((_, index) => ({
      variantId: variantRows[index].id, attributeValueId: attributeValueRows[index].id,
    }))).returning()

    const locationRows = await tx.insert(inventoryLocations).values(numbers.map((number) => ({
      code: `CN-${suffix}-${String(number).padStart(3, '0')}`, name: `Chi nhánh ${number}`,
      type: number % 5 === 0 ? 'warehouse' : 'store', address: `${number} Đường Công Nghệ, TP.HCM`,
      phone: `090${String(number).padStart(7, '0')}`,
    }))).returning()

    const stock = await applyStockOperation(tx, { key: `seed:${randomUUID()}`, kind: 'receipt', referenceType: 'development_seed', note: 'Nhập kho fixture phát triển',
      movements: numbers.map((number,index) => ({ locationId: locationRows[index].id, variantId: variantRows[index].id, type: 'receipt', quantity: 50+number, onHandDelta: 50+number, reservedDelta: 0 })),
    })
    const movementRows = stock.movements
    const balanceRows = []
    for (let index=0; index<numbers.length; index++) balanceRows.push((await tx.update(inventoryBalances).set({reorderLevel:10}).where(and(eq(inventoryBalances.locationId,locationRows[index].id),eq(inventoryBalances.variantId,variantRows[index].id))).returning())[0])

    const cartRows = await tx.insert(carts).values(numbers.map(() => ({ status: 'active' }))).returning()
    const cartItemRows = await tx.insert(cartItems).values(numbers.map((number, index) => ({
      cartId: cartRows[index].id, variantId: variantRows[index].id,
      quantity: 1 + (number % 3), unitPrice: variantRows[index].price,
    }))).returning()

    const promotionRows = await tx.insert(promotions).values(numbers.map((number) => ({
      name: `Khuyến mãi ${number}`, discountType: number % 2 === 0 ? 'percentage' : 'fixed',
      discountValue: money(number % 2 === 0 ? 10 : 100000), minimumOrderValue: money(1000000),
      maximumDiscount: money(500000), startsAt: now, endsAt: nextYear,
    }))).returning()

    const promotionCodeRows = await tx.insert(promotionCodes).values(numbers.map((number, index) => ({
      promotionId: promotionRows[index].id, code: `SALE-${suffix}-${number}`.toUpperCase(),
      usageLimit: 1000, usagePerUser: 1, usedCount: 1,
    }))).returning()

    const orderRows = await tx.insert(orders).values(numbers.map((number) => {
      const subtotal = 1000000 + number * 375000
      return {
        code: `ORD-${suffix}-${String(number).padStart(4, '0')}`.toUpperCase(),
        guestEmail: `guest-${number}-${suffix}@example.com`, subtotal: money(subtotal),
        discountTotal: money(100000), shippingTotal: money(30000), grandTotal: money(subtotal - 70000),
        orderStatus: 'confirmed', paymentStatus: 'paid', fulfillmentStatus: 'processing',
      }
    })).returning()

    const orderAddressRows = await tx.insert(orderAddresses).values(numbers.map((number, index) => ({
      orderId: orderRows[index].id, recipientName: `Khách hàng ${number}`,
      phone: `091${String(number).padStart(7, '0')}`, addressLine: `${number} Đường Mẫu`,
      ward: `Phường ${number % 20 + 1}`, district: `Quận ${number % 12 + 1}`, province: 'TP. Hồ Chí Minh',
    }))).returning()

    const orderItemRows = await tx.insert(orderItems).values(numbers.map((number, index) => ({
      orderId: orderRows[index].id, variantId: variantRows[index].id, sku: variantRows[index].sku,
      productName: productRows[index].name, variantName: variantRows[index].name,
      unitPrice: variantRows[index].price, quantity: 1, total: variantRows[index].price,
    }))).returning()

    const promotionUsageRows = await tx.insert(promotionUsages).values(numbers.map((_, index) => ({
      promotionCodeId: promotionCodeRows[index].id, orderId: orderRows[index].id,
    }))).returning()

    const paymentRows = await tx.insert(payments).values(numbers.map((number, index) => ({
      orderId: orderRows[index].id, provider: number % 2 === 0 ? 'momo' : 'vnpay',
      method: 'online', transactionId: `TX-${suffix}-${number}`.toUpperCase(),
      amount: orderRows[index].grandTotal, status: 'completed', paidAt: now,
    }))).returning()

    const shipmentRows = await tx.insert(shipments).values(numbers.map((number, index) => ({
      orderId: orderRows[index].id, carrier: number % 2 === 0 ? 'GHN' : 'GHTK',
      trackingNumber: `TRACK-${suffix}-${number}`.toUpperCase(), status: 'processing',
    }))).returning()

    const historyRows = await tx.insert(orderStatusHistories).values(numbers.map((number, index) => ({
      orderId: orderRows[index].id, status: 'confirmed', note: `Đơn mẫu ${number} đã xác nhận`,
    }))).returning()

    const reviewRows = await tx.insert(productReviews).values(numbers.map((number, index) => ({
      productId: productRows[index].id, orderItemId: orderItemRows[index].id,
      guestName: `Người đánh giá ${number}`, title: `Đánh giá sản phẩm ${number}`,
      score: 1 + (number % 5), comment: `Nội dung đánh giá mẫu số ${number}.`, isVerifiedPurchase: true,
    }))).returning()

    const addressRows = await tx.insert(addresses).values(numbers.map((number) => ({
      recipientName: `Khách nhận ${number}`, phone: `092${String(number).padStart(7, '0')}`,
      addressLine: `${number} Đường Địa Chỉ`, ward: `Phường ${number % 20 + 1}`,
      district: `Quận ${number % 12 + 1}`, province: 'TP. Hồ Chí Minh', isDefault: false,
    }))).returning()

    const conversationRows = await tx.insert(conversations).values(numbers.map((number) => ({
      type: number % 2 === 0 ? 'buyer-chatbot' : 'buyer-seller', subject: `Hỗ trợ đơn hàng ${number}`,
    }))).returning()

    const participantRows = await tx.insert(conversationParticipants).values(numbers.map((number, index) => ({
      conversationId: conversationRows[index].id, actorType: number % 2 === 0 ? 'chatbot' : 'guest',
      displayName: number % 2 === 0 ? 'Trợ lý mua sắm' : `Khách ${number}`,
    }))).returning()

    const messageRows = await tx.insert(messages).values(numbers.map((number, index) => ({
      conversationId: conversationRows[index].id, senderType: participantRows[index].actorType,
      content: `Tin nhắn hội thoại mẫu số ${number}.`, metadata: { seeded: true },
    }))).returning()

    const attachmentRows = await tx.insert(messageAttachments).values(numbers.map((number, index) => ({
      messageId: messageRows[index].id, url: `https://picsum.photos/seed/chat-${number}-${suffix}/800/600`,
      mimeType: 'image/jpeg', fileName: `chat-${number}.jpg`, sizeBytes: 100000 + number,
    }))).returning()

    return {
      address: addressRows.length, attribute: attributeRows.length, attributeValue: attributeValueRows.length,
      brand: brandRows.length, cart: cartRows.length, cartItem: cartItemRows.length, category: categoryRows.length,
      conversation: conversationRows.length, conversationParticipant: participantRows.length,
      inventoryBalance: balanceRows.length, inventoryLocation: locationRows.length, message: messageRows.length,
      messageAttachment: attachmentRows.length, orderAddress: orderAddressRows.length, orderItem: orderItemRows.length,
      orderStatusHistory: historyRows.length, payment: paymentRows.length, product: productRows.length,
      productContentSection: contentRows.length, productMedia: mediaRows.length, productReview: reviewRows.length,
      productVariant: variantRows.length, promotion: promotionRows.length, promotionCode: promotionCodeRows.length,
      promotionUsage: promotionUsageRows.length, salesOrder: orderRows.length, shipment: shipmentRows.length,
      stockMovement: movementRows.length, variantAttributeValue: variantAttributeRows.length,
    }
  })

  console.log('Seed completed:', result)
}

seed().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(() => pool.end())
