import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
const mocks = vi.hoisted(() => ({ create: vi.fn(), query: vi.fn() }))
vi.mock('../src/services/payment-gateways.js', async (importOriginal) => ({
  ...(await importOriginal()),
  createGatewayPayment: mocks.create,
  queryGatewayPayment: mocks.query,
}))

describe.skipIf(process.env.RUN_CLOUD_CHECKOUT_TESTS !== 'true')(
  'checkout on Neon / Drizzle RC (isolated disposable fixtures)',
  () => {
    let db, pool, schema, checkout, adminOrders
    let buyers = [],
      saved = [],
      product,
      variant,
      location
    const suffix = randomUUID().slice(0, 12)
    const input = (buyer = 0, provider = 'cod', quantity = 1) => ({
      items: [{ variantId: variant.id, quantity }],
      addressId: saved[buyer].id,
      provider,
      shipping: 'standard',
      note: '',
    })
    async function payload(buyer = 0, provider = 'cod', quantity = 1) {
      const data = input(buyer, provider, quantity)
      const quote = await checkout.quoteCheckout(buyers[buyer].id, data)
      return {
        checkout: data,
        requestKey: randomUUID(),
        quoteToken: quote.quoteToken,
      }
    }
    async function balance() {
      return (
        await db
          .select()
          .from(schema.inventoryBalances)
          .where(eq(schema.inventoryBalances.variantId, variant.id))
      )[0]
    }
    async function session(orderId) {
      return (
        await db
          .select()
          .from(schema.checkoutSessions)
          .where(eq(schema.checkoutSessions.orderId, orderId))
      )[0]
    }
    beforeAll(async () => {
      ;({ db, pool } = await import('../src/database/index.js'))
      schema = await import('../src/database/schema.js')
      checkout = await import('../src/services/checkout.js')
      adminOrders = await import('../src/services/order.js')
      buyers = await db
        .insert(schema.user)
        .values(
          [0, 1].map((index) => ({
            name: 'Checkout test fixture',
            email: `checkout-${suffix}-${index}@example.com`,
            emailVerified: true,
          })),
        )
        .returning()
      for (const buyer of buyers)
        saved.push(
          (
            await db
              .insert(schema.addresses)
              .values({
                userId: buyer.id,
                recipientName: 'Test Buyer',
                phone: '0901234567',
                addressLine: 'Test street 123',
                district: 'Test district',
                province: 'Test province',
                isDefault: true,
              })
              .returning()
          )[0],
        )
      product = (
        await db
          .insert(schema.products)
          .values({
            name: 'Checkout disposable product',
            slug: `checkout-test-${suffix}`,
            status: 'active',
          })
          .returning()
      )[0]
      variant = (
        await db
          .insert(schema.productVariants)
          .values({
            productId: product.id,
            name: 'Test variant',
            sku: `CHECKOUT-${suffix}`,
            price: '200000',
            status: 'active',
          })
          .returning()
      )[0]
      location = (
        await db
          .insert(schema.inventoryLocations)
          .values({
            code: `TEST-${suffix}`,
            name: 'Disposable test location',
            type: 'warehouse',
            isActive: true,
          })
          .returning()
      )[0]
      await db
        .insert(schema.inventoryBalances)
        .values({
          variantId: variant.id,
          locationId: location.id,
          quantityOnHand: 5,
        })
    }, 30000)
    afterEach(async () => {
      if (buyers.length) {
        const fixtureOrders = await db.select({ id: schema.orders.id }).from(schema.orders).where(inArray(schema.orders.userId, buyers.map(buyer => buyer.id)))
        if (fixtureOrders.length) {
          const orderIds=fixtureOrders.map(order=>order.id)
          await db.delete(schema.orderAllocations).where(inArray(schema.orderAllocations.orderId,orderIds))
          await db.delete(schema.shipmentEvents).where(inArray(schema.shipmentEvents.orderId,orderIds))
          await db.delete(schema.fulfillmentCommands).where(inArray(schema.fulfillmentCommands.orderId,orderIds))
          await db.delete(schema.orderFulfillments).where(inArray(schema.orderFulfillments.orderId,orderIds))
        }
        if (fixtureOrders.length) await db.delete(schema.inventoryReservations).where(inArray(schema.inventoryReservations.orderId, fixtureOrders.map(order => order.id)))
      }
      if (variant) await db.delete(schema.inventoryBaselines).where(eq(schema.inventoryBaselines.variantId, variant.id))
      if (buyers.length)
        await db.delete(schema.orders).where(
          inArray(
            schema.orders.userId,
            buyers.map((buyer) => buyer.id),
          ),
        )
      if (location)
        await db
          .delete(schema.stockMovements)
          .where(eq(schema.stockMovements.locationId, location.id))
      if (buyers.length) await db.delete(schema.inventoryOperations).where(inArray(schema.inventoryOperations.actorId, buyers.map(buyer => buyer.id)))
      if (variant) {
        await db
          .update(schema.inventoryBalances)
          .set({ quantityOnHand: 5, quantityReserved: 0 })
          .where(eq(schema.inventoryBalances.variantId, variant.id))
        await db
          .update(schema.productVariants)
          .set({ price: '200000', status: 'active' })
          .where(eq(schema.productVariants.id, variant.id))
        await db
          .update(schema.products)
          .set({ status: 'active' })
          .where(eq(schema.products.id, product.id))
      }
      vi.resetAllMocks()
    }, 30000)
    afterAll(async () => {
      try {
        if (location) {
          await db
            .delete(schema.stockMovements)
            .where(eq(schema.stockMovements.locationId, location.id))
          await db
            .delete(schema.inventoryBalances)
            .where(eq(schema.inventoryBalances.locationId, location.id))
        }
        if (product)
          await db
            .delete(schema.products)
            .where(eq(schema.products.id, product.id))
        if (location)
          await db
            .delete(schema.inventoryLocations)
            .where(eq(schema.inventoryLocations.id, location.id))
        if (buyers.length)
          await db.delete(schema.user).where(
            inArray(
              schema.user.id,
              buyers.map((buyer) => buyer.id),
            ),
          )
      } finally {
        await pool?.end()
      }
    }, 30000)
    it('quotes real DB prices, rejects forged prices and another buyer address', async () => {
      const quote = await checkout.quoteCheckout(buyers[0].id, input())
      expect(quote.grandTotal).toBe(200000)
      expect((await balance()).quantityReserved).toBe(0)
      await expect(
        checkout.quoteCheckout(buyers[0].id, { ...input(), grandTotal: 1 }),
      ).rejects.toThrow()
      await expect(
        checkout.quoteCheckout(buyers[0].id, input(1)),
      ).rejects.toMatchObject({ status: 403 })
    })
    it('persists COD snapshots and prevents duplicate orders or key reuse with different content', async () => {
      const data = await payload(0, 'cod', 2)
      const order = await checkout.placeCheckout(buyers[0].id, data)
      expect(order).toMatchObject({
        orderStatus: 'confirmed',
        paymentStatus: 'unpaid',
        grandTotal: '400000.00',
      })
      expect(order.address.recipientName).toBe('Test Buyer')
      expect((await checkout.placeCheckout(buyers[0].id, data)).id).toBe(
        order.id,
      )
      expect((await balance()).quantityReserved).toBe(2)
      await expect(
        checkout.placeCheckout(buyers[0].id, {
          ...data,
          checkout: { ...data.checkout, note: 'changed' },
        }),
      ).rejects.toMatchObject({ status: 409 })
    })
    it('serializes concurrent stock reservations and never oversells', async () => {
      const [a, b] = await Promise.all([
        payload(0, 'cod', 4),
        payload(1, 'cod', 4),
      ])
      const result = await Promise.allSettled([
        checkout.placeCheckout(buyers[0].id, a),
        checkout.placeCheckout(buyers[1].id, b),
      ])
      expect(
        result.filter((value) => value.status === 'fulfilled'),
      ).toHaveLength(1)
      expect((await balance()).quantityReserved).toBe(4)
    })
    it('rejects draft products and price changes after quoting', async () => {
      const data = await payload()
      await db
        .update(schema.productVariants)
        .set({ price: '210000' })
        .where(eq(schema.productVariants.id, variant.id))
      await expect(
        checkout.placeCheckout(buyers[0].id, data),
      ).rejects.toMatchObject({ status: 409 })
      expect((await balance()).quantityReserved).toBe(0)
      await db
        .update(schema.products)
        .set({ status: 'draft' })
        .where(eq(schema.products.id, product.id))
      await expect(
        checkout.quoteCheckout(buyers[0].id, input()),
      ).rejects.toMatchObject({ status: 409 })
    })
    it('keeps orders isolated by owner and cancels COD exactly once', async () => {
      const order = await checkout.placeCheckout(buyers[0].id, await payload())
      await expect(
        checkout.getCustomerOrder(buyers[1].id, order.id),
      ).rejects.toMatchObject({ status: 404 })
      await expect(
        checkout.cancelCheckout(buyers[1].id, order.id),
      ).rejects.toMatchObject({ status: 404 })
      await checkout.cancelCheckout(buyers[0].id, order.id)
      await checkout.cancelCheckout(buyers[0].id, order.id)
      expect((await balance()).quantityReserved).toBe(0)
    })
    it('rejects mismatched amounts, handles repeated paid callbacks and consumes stock once on completion', async () => {
      const order = await checkout.placeCheckout(
        buyers[0].id,
        await payload(0, 'stripe'),
      )
      mocks.create.mockImplementation(async (session) => ({
        providerId: `cs_${session.id}`,
        url: 'https://checkout.stripe.com/c/pay/test',
      }))
      await checkout.initiatePayment(buyers[0].id, order.id)
      const state = await session(order.id)
      const paid = {
        state: 'paid',
        providerId: state.providerOrderId,
        amount: '200000',
        currency: 'VND',
        transactionId: `capture-${state.id}`,
      }
      await expect(
        checkout.applyGatewayResult(state.id, { ...paid, amount: 1 }),
      ).rejects.toMatchObject({ status: 409 })
      await Promise.all([
        checkout.applyGatewayResult(state.id, paid),
        checkout.applyGatewayResult(state.id, paid),
      ])
      expect(await checkout.getCustomerOrder(buyers[0].id, order.id)).toMatchObject({
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        fulfillmentStatus: 'unfulfilled',
      })
      // Payment is confirmed, but delivery has not completed or issued inventory.
      expect(await balance()).toMatchObject({ quantityOnHand: 5, quantityReserved: 1 })
      await adminOrders.changeOrderStatus(order.id, { status: 'processing' })
      const fulfillment=await import('../src/services/fulfillment.js')
      const actor={id:buyers[0].id,role:'master'}
      await fulfillment.shipmentCommand(order.id,{commandId:randomUUID(),action:'prepare',note:'Prepare checkout regression',carrier:'Fixture',trackingNumber:randomUUID()},actor)
      const handover={commandId:randomUUID(),action:'handover',note:'Handover checkout regression'}
      await fulfillment.shipmentCommand(order.id,handover,actor)
      await fulfillment.shipmentCommand(order.id,handover,actor)
      await fulfillment.shipmentCommand(order.id,{commandId:randomUUID(),action:'delivered',note:'Deliver checkout regression'},actor)
      expect(await balance()).toMatchObject({
        quantityOnHand: 4,
        quantityReserved: 0,
      })
    })
    it('queries providers outside the transaction so a slow gateway does not hold session locks',async()=>{
      const order=await checkout.placeCheckout(buyers[0].id,await payload(0,'stripe'))
      mocks.create.mockImplementation(async(session)=>({providerId:`cs_${session.id}`,url:'https://checkout.stripe.com/c/pay/test'}))
      await checkout.initiatePayment(buyers[0].id,order.id)
      mocks.query.mockImplementationOnce(async(current)=>{
        // NOWAIT on another connection would fail if refresh held the old transaction lock.
        await db.transaction(async tx=>{
          await tx.select().from(schema.checkoutSessions).where(eq(schema.checkoutSessions.id,current.id)).for('update',{noWait:true})
        })
        return {state:'paid',providerId:current.providerOrderId,amount:current.providerAmount,currency:current.currency,transactionId:`capture-${current.id}`}
      })
      expect((await checkout.refreshPayment(buyers[0].id,order.id)).paymentStatus).toBe('paid')
    })
    it('releases failed payment stock once and blocks manual edits of managed totals', async () => {
      const order = await checkout.placeCheckout(
        buyers[0].id,
        await payload(0, 'stripe'),
      )
      const state = await session(order.id)
      await expect(
        adminOrders.updateOrder(order.id, { grandTotal: '1' }),
      ).rejects.toMatchObject({ status: 409 })
      await checkout.applyGatewayResult(state.id, { state: 'failed' })
      await checkout.applyGatewayResult(state.id, { state: 'failed' })
      expect(await balance()).toMatchObject({
        quantityOnHand: 5,
        quantityReserved: 0,
      })
      expect(
        (await checkout.getCustomerOrder(buyers[0].id, order.id)).orderStatus,
      ).toBe('cancelled')
    })
    it('keeps a timed-out gateway attempt reserved and uses the same upstream idempotency key on recovery', async () => {
      const order = await checkout.placeCheckout(
        buyers[0].id,
        await payload(0, 'stripe'),
      )
      mocks.create.mockRejectedValueOnce(
        Object.assign(new Error('Provider timeout'), { status: 502 }),
      )
      await expect(
        checkout.initiatePayment(buyers[0].id, order.id),
      ).rejects.toMatchObject({ status: 502 })
      expect((await balance()).quantityReserved).toBe(1)
      const state = await session(order.id)
      await db
        .update(schema.checkoutSessions)
        .set({ updatedAt: new Date(Date.now() - 61000) })
        .where(eq(schema.checkoutSessions.id, state.id))
      mocks.create.mockResolvedValueOnce({
        providerId: 'recovered-checkout',
        url: 'https://checkout.stripe.com/c/pay/test',
      })
      await checkout.initiatePayment(buyers[0].id, order.id)
      expect(mocks.create.mock.calls[0][0].id).toBe(
        mocks.create.mock.calls[1][0].id,
      )
      expect((await balance()).quantityReserved).toBe(1)
    })
    it('records a verified late payment as refund-required without reserving or shipping stock again', async () => {
      const order = await checkout.placeCheckout(
        buyers[0].id,
        await payload(0, 'stripe'),
      )
      mocks.create.mockResolvedValueOnce({
        providerId: `cs_late_${order.id}`,
        url: 'https://checkout.stripe.com/c/pay/test',
      })
      await checkout.initiatePayment(buyers[0].id, order.id)
      const state = await session(order.id)
      await checkout.applyGatewayResult(state.id, { state: 'failed' })
      await checkout.applyGatewayResult(state.id, {
        state: 'paid',
        providerId: state.providerOrderId,
        amount: state.providerAmount,
        currency: state.currency,
        transactionId: `late-${state.id}`,
      })
      const updated = await checkout.getCustomerOrder(buyers[0].id, order.id)
      expect(updated).toMatchObject({
        orderStatus: 'cancelled',
        paymentStatus: 'paid',
        payment: { state: 'paid_late', requiresSupport: true },
      })
      expect(await balance()).toMatchObject({
        quantityOnHand: 5,
        quantityReserved: 0,
      })
    })
  },
)
