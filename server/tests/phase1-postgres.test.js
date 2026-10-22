import {request as httpRequest} from './helpers/request.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
const state = vi.hoisted(() => ({ buyerId: null }))
vi.mock('../src/lib/auth/index.js', () => ({
  auth: {
    api: {
      getSession: async ({ headers }) =>
        headers.get('cookie')
          ? {
              user: {
                id:
                  headers.get('cookie') === 'admin'
                    ? '00000000-0000-4000-8000-000000000001'
                    : state.buyerId,
                role: headers.get('cookie') === 'admin' ? 'master' : 'user',
              },
            }
          : null,
    },
    handler: vi.fn(),
  },
}))
vi.mock('../src/services/payment-gateways.js', () => ({
  assertGateway: vi.fn(),
  settlementAmount: (_provider, value) => ({
    amount: String(value),
    currency: 'VND',
  }),
  paymentMethods: () => [],
  createGatewayPayment: vi.fn(),
  gatewayRequestId: vi.fn(),
  queryGatewayPayment: vi.fn(),
  getStripe: vi.fn(),
  verifyMomoCallback: () => false,
  verifyZaloCallback: () => false,
}))
const enabled = process.env.RUN_PHASE1_POSTGRES_TESTS === 'true'
const admin = { id: '00000000-0000-4000-8000-000000000001', role: 'master' }
let db, pool, s, inventory, checkout, order, app
const id = () => randomUUID()
async function fixture(quantity = 10) {
  const suffix = id()
  const [product] = await db
    .insert(s.products)
    .values({ name: suffix, slug: suffix })
    .returning()
  const [variant] = await db
    .insert(s.productVariants)
    .values({
      productId: product.id,
      sku: suffix,
      name: 'Fixture',
      price: '100000',
      costPrice: '33333',
      barcode: `private-${suffix}`,
    })
    .returning()
  const [source, target] = await db
    .insert(s.inventoryLocations)
    .values([
      { code: `S-${suffix}`, name: 'Source' },
      { code: `T-${suffix}`, name: 'Target' },
    ])
    .returning()
  await db.insert(s.inventoryBalances).values({
    locationId: source.id,
    variantId: variant.id,
    quantityOnHand: quantity,
  })
  await db.insert(s.inventoryBaselines).values({
    locationId: source.id,
    variantId: variant.id,
    quantityOnHand: quantity,
    quantityReserved: 0,
  })
  return { product, variant, source, target }
}
const balance = async (f) =>
  (
    await db
      .select()
      .from(s.inventoryBalances)
      .where(
        and(
          eq(s.inventoryBalances.locationId, f.source.id),
          eq(s.inventoryBalances.variantId, f.variant.id),
        ),
      )
  )[0]
const movement = (f, quantity, type = 'receipt', operationId = id()) => ({
  operationId,
  locationId: f.source.id,
  variantId: f.variant.id,
  quantity,
  type,
  note: 'Phase 1 local fixture',
})
async function buyer(f) {
  const suffix = id()
  const [user] = await db
    .insert(s.user)
    .values({ name: 'Buyer fixture', email: `${suffix}@example.test` })
    .returning()
  const [address] = await db
    .insert(s.addresses)
    .values({
      userId: user.id,
      recipientName: 'Buyer fixture',
      phone: '0901234567',
      addressLine: 'Fixture street',
      district: 'Fixture district',
      province: 'Fixture province',
    })
    .returning()
  const [cart] = await db
    .insert(s.carts)
    .values({ userId: user.id })
    .returning()
  await db.insert(s.cartItems).values({
    cartId: cart.id,
    variantId: f.variant.id,
    quantity: 3,
    unitPrice: f.variant.price,
  })
  return { user, address, cart }
}
async function payload(f, b, quantity = 1, voucherCode = '') {
  const input = {
    items: [{ variantId: f.variant.id, quantity }],
    addressId: b.address.id,
    provider: 'cod',
    voucherCode,
  }
  const quote = await checkout.quoteCheckout(b.user.id, input)
  return { requestKey: id(), quoteToken: quote.quoteToken, checkout: input }
}
const request = async (path, { cookie, method = 'GET', body } = {}) => {
  const response = await httpRequest(app,path, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return { status: response.status, data: await response.json() }
}
describe.skipIf(!enabled)(
  'Phase 1: actual isolated PostgreSQL, migrations, authorization and concurrency',
  () => {
    beforeAll(async () => {
      const target = new URL(process.env.PHASE1_DATABASE_URL)
      if (
        target.hostname !== '127.0.0.1' ||
        process.env.DATABASE_URL !== process.env.PHASE1_DATABASE_URL
      )
        throw new Error(
          'Phase 1 suite requires the runner-owned local database; cloud targets are refused.',
        )
      ;({ db, pool } = await import('../src/database/index.js'))
      s = await import('../src/database/schema.js')
      inventory = await import('../src/services/inventory.js')
      checkout = await import('../src/services/checkout.js')
      order = await import('../src/services/order.js')
      const { default: AppModule } = await import('../src/module.js')
      app = AppModule()
      state.buyerId = (
        await db
          .insert(s.user)
          .values({ name: 'API user', email: 'api-user@example.test' })
          .returning()
      )[0].id
    })
    afterAll(async () => {
      await pool?.end()
    })
    it('backfills pre-existing reservations without touching balances or historical stock', async () => {
      const [b] = await db
        .select()
        .from(s.inventoryBalances)
        .where(
          eq(
            s.inventoryBalances.locationId,
            '00000000-0000-4000-8000-000000000004',
          ),
        )
      expect(b).toMatchObject({ quantityOnHand: 5, quantityReserved: 2 })
      const [r] = await db
        .select()
        .from(s.inventoryReservations)
        .where(
          eq(
            s.inventoryReservations.orderId,
            '00000000-0000-4000-8000-000000000005',
          ),
        )
      expect(r).toMatchObject({ quantity: 2, state: 'reserved' })
      const report = await inventory.reconcileInventory()
      expect(
        report.items.find((row) => row.locationId === b.locationId).consistent,
      ).toBe(true)
    })
    it('hides price/codes and inactive products from guests, users and admins on public URLs', async () => {
      const f = await fixture()
      const [draft] = await db
        .insert(s.products)
        .values({ name: 'Hidden', slug: id(), status: 'draft' })
        .returning()
      const [hidden] = await db
        .insert(s.productVariants)
        .values({
          productId: draft.id,
          sku: id(),
          name: 'Hidden',
          price: '1',
          costPrice: '999',
        })
        .returning()
      for (const cookie of [undefined, 'user', 'admin']) {
        const result = await request(`/product/variant/${f.variant.id}`, {
          cookie,
        })
        expect(result.status).toBe(200)
        expect(result.data).not.toHaveProperty('costPrice')
        expect(result.data).not.toHaveProperty('barcode')
        expect((await request(`/product/${draft.id}`, { cookie })).status).toBe(
          404,
        )
        expect(
          (await request(`/product/variant/${hidden.id}`, { cookie })).status,
        ).toBe(404)
        expect(
          (await request('/product?status=draft', { cookie })).status,
        ).toBe(400)
        expect((await request('/product?admin=true', { cookie })).status).toBe(
          400,
        )
      }
      const rows = await request('/product/variant?limit=100')
      expect(rows.data.items.some((row) => row.id === hidden.id)).toBe(false)
    })
    it('keeps complete admin reads and blocks anonymous/customer writes and old write aliases', async () => {
      const f = await fixture()
      for (const cookie of [undefined, 'user'])
        expect(
          (
            await request(`/admin/catalog/product-variants/${f.variant.id}`, {
              cookie,
            })
          ).status,
        ).toBe(cookie ? 403 : 401)
      const adminRead = await request(
        `/admin/catalog/product-variants/${f.variant.id}`,
        { cookie: 'admin' },
      )
      expect(adminRead.data.costPrice).toBe('33333.00')
      expect(
        (
          await request(`/product/${f.product.id}`, {
            cookie: 'admin',
            method: 'PATCH',
            body: { name: 'Forbidden old alias' },
          })
        ).status,
      ).toBe(404)
      for (const body of [
        { name: 'Forged', slug: id(), id: id() },
        { name: 'Forged', slug: id(), createdAt: new Date().toISOString() },
      ]) {
        const result = await request('/admin/catalog/products', {
          cookie: 'admin',
          method: 'POST',
          body,
        })
        expect(result.status).toBe(400)
        expect(result.data.issues.length).toBeGreaterThan(0)
      }
      expect(
        (
          await request(`/admin/catalog/products/${f.product.id}`, {
            cookie: 'user',
            method: 'PATCH',
            body: { name: 'No' },
          })
        ).status,
      ).toBe(403)
    })
    it('filters nested media/content/attribute links and validates relation ownership on admin writes', async () => {
      const f = await fixture()
      const [hidden] = await db
        .insert(s.productVariants)
        .values({
          productId: f.product.id,
          sku: id(),
          name: 'Hidden',
          price: '1',
          status: 'inactive',
        })
        .returning()
      const [media] = await db
        .insert(s.productMedia)
        .values({
          productId: f.product.id,
          variantId: hidden.id,
          url: 'https://example.test/private.png',
        })
        .returning()
      const [attribute] = await db
        .insert(s.attributes)
        .values({ name: id(), code: id() })
        .returning()
      const [value] = await db
        .insert(s.attributeValues)
        .values({
          attributeId: attribute.id,
          value: 'Hidden',
          metadata: { secret: 'PRIVATE' },
        })
        .returning()
      await db
        .insert(s.variantAttributeValues)
        .values({ variantId: hidden.id, attributeValueId: value.id })
      expect((await request(`/product/media/${media.id}`)).status).toBe(404)
      expect((await request(`/attribute/item/${value.id}`)).status).toBe(404)
      expect(
        (await request(`/attribute/variant/${hidden.id}/${value.id}`)).status,
      ).toBe(404)
      await db
        .insert(s.variantAttributeValues)
        .values({ variantId: f.variant.id, attributeValueId: value.id })
      expect(
        (await request(`/attribute/item/${value.id}`)).data,
      ).not.toHaveProperty('metadata')
      const other = await fixture()
      const invalid = await request('/admin/catalog/product-media', {
        cookie: 'admin',
        method: 'POST',
        body: {
          productId: f.product.id,
          variantId: other.variant.id,
          url: 'https://example.test/mismatch.png',
        },
      })
      expect(invalid.status).toBe(400)
      expect(invalid.data.issues[0].path).toEqual(['variantId'])
      const badRef = await request('/admin/catalog/products', {
        cookie: 'admin',
        method: 'POST',
        body: { name: 'Bad ref', slug: id(), brandId: id() },
      })
      expect(badRef.status).toBe(400)
      expect(badRef.data.issues[0].path).toEqual(['brandId'])
    })
    it('hides descendants of inactive categories and prevents category cycles', async () => {
      const [parent, child] = await db
        .insert(s.categories)
        .values([
          { name: 'Hidden parent', slug: id(), isActive: false },
          { name: 'Child', slug: id() },
        ])
        .returning()
      await db
        .update(s.categories)
        .set({ parentId: parent.id })
        .where(eq(s.categories.id, child.id))
      const f = await fixture()
      await db
        .update(s.products)
        .set({ categoryId: child.id })
        .where(eq(s.products.id, f.product.id))
      expect((await request(`/product/${f.product.id}`)).status).toBe(404)
      expect((await request(`/catalog/category/${child.id}`)).status).toBe(404)
      const cycle = await request(`/admin/catalog/categories/${parent.id}`, {
        cookie: 'admin',
        method: 'PATCH',
        body: { parentId: child.id },
      })
      expect(cycle.status).toBe(400)
      expect(cycle.data.issues[0].path).toEqual(['parentId'])
      // Legacy DB may already contain cycles, even though HTTP writes reject them.
      await db
        .update(s.categories)
        .set({ isActive: true, parentId: child.id })
        .where(eq(s.categories.id, parent.id))
      expect((await request(`/product/${f.product.id}`)).status).toBe(404)
      expect((await request(`/catalog/category/${child.id}`)).status).toBe(404)
    })
    it('protects unpublished reviews, private identity and moderation writes', async () => {
      const f = await fixture()
      const [published] = await db
        .insert(s.productReviews)
        .values({
          productId: f.product.id,
          userId: admin.id,
          score: 5,
          status: 'published',
        })
        .returning()
      const [hidden] = await db
        .insert(s.productReviews)
        .values({
          productId: f.product.id,
          userId: state.buyerId,
          score: 1,
          status: 'pending',
        })
        .returning()
      expect((await request(`/review/${hidden.id}`)).status).toBe(404)
      expect(
        (await request(`/review/${published.id}`)).data,
      ).not.toHaveProperty('userId')
      expect(
        (await request(`/review/moderation/${hidden.id}`, { cookie: 'user' }))
          .status,
      ).toBe(403)
      expect(
        (await request(`/review/moderation/${hidden.id}`, { cookie: 'admin' }))
          .status,
      ).toBe(200)
      expect(
        (
          await request('/review', {
            cookie: 'user',
            method: 'POST',
            body: { productId: f.product.id, score: 5, userId: admin.id },
          })
        ).status,
      ).toBe(400)
      await db
        .update(s.products)
        .set({ status: 'draft' })
        .where(eq(s.products.id, f.product.id))
      expect((await request(`/review/${published.id}`)).status).toBe(404)
      expect(
        (await request(`/review/summary?productId=${f.product.id}`)).data.count,
      ).toBe(0)
    })
    it('does not lose simultaneous receipts and records accurate before/after audit', async () => {
      const f = await fixture(10)
      const results = await Promise.all(
        Array.from({ length: 12 }, () =>
          inventory.createStockMovement(movement(f, 5), admin),
        ),
      )
      expect((await balance(f)).quantityOnHand).toBe(70)
      expect(
        results.every(
          (row) =>
            row.actorId === admin.id &&
            row.onHandAfter - row.onHandBefore === 5 &&
            row.reservedAfter === row.reservedBefore,
        ),
      ).toBe(true)
      expect(new Set(results.map((row) => row.ledgerIndex)).size).toBe(12)
    })
    it('only permits available stock to be issued by concurrent requests', async () => {
      const f = await fixture(5)
      const result = await Promise.allSettled([
        inventory.createStockMovement(movement(f, 4, 'issue'), admin),
        inventory.createStockMovement(movement(f, 4, 'issue'), admin),
      ])
      expect(result.filter((row) => row.status === 'fulfilled')).toHaveLength(1)
      expect(
        result.find((row) => row.status === 'rejected').reason.status,
      ).toBe(409)
      expect((await balance(f)).quantityOnHand).toBe(1)
    })
    it('replays a concurrent operation once and rejects changed payload or actor', async () => {
      const f = await fixture(),
        input = movement(f, 2)
      const rows = await Promise.all(
        Array.from({ length: 8 }, () =>
          inventory.createStockMovement(input, admin),
        ),
      )
      expect(new Set(rows.map((row) => row.id)).size).toBe(1)
      expect((await balance(f)).quantityOnHand).toBe(12)
      await expect(
        inventory.createStockMovement({ ...input, quantity: 3 }, admin),
      ).rejects.toMatchObject({ status: 409 })
      await expect(
        inventory.createStockMovement(input, { ...admin, id: state.buyerId }),
      ).rejects.toMatchObject({ status: 409 })
    })
    it('makes transfer atomic and idempotent, including first creation of a target balance', async () => {
      const f = await fixture(10)
      const input = {
        operationId: id(),
        sourceLocationId: f.source.id,
        targetLocationId: f.target.id,
        variantId: f.variant.id,
        quantity: 4,
        note: 'Transfer fixture',
      }
      const [a, b] = await Promise.all([
        inventory.transferStock(input, admin),
        inventory.transferStock(input, admin),
      ])
      expect(a.operationId).toBe(b.operationId)
      expect(a.movements).toHaveLength(2)
      expect((await balance(f)).quantityOnHand).toBe(6)
      const target = await inventory.getInventoryBalance(
        f.target.id,
        f.variant.id,
      )
      expect(target.quantityOnHand).toBe(4)
      expect(a.movements.reduce((sum, row) => sum + row.onHandDelta, 0)).toBe(0)
      const replayChange = { ...input, note: 'Changed intent' }
      await expect(
        inventory.transferStock(replayChange, admin),
      ).rejects.toMatchObject({ status: 409 })
    })
    it('rolls back both sides and the operation if writing the destination fails', async () => {
      const f = await fixture(10)
      await pool.query(
        `create function phase1_transfer_failure() returns trigger language plpgsql as $$ begin if NEW.location_id = '${f.target.id}'::uuid and NEW.type='transfer_in' then raise exception 'fixture destination failure'; end if; return NEW; end $$; create trigger phase1_transfer_failure before insert on stock_movement for each row execute function phase1_transfer_failure()`,
      )
      try {
        await expect(
          inventory.transferStock(
            {
              operationId: id(),
              sourceLocationId: f.source.id,
              targetLocationId: f.target.id,
              variantId: f.variant.id,
              quantity: 4,
              note: 'Rollback fixture',
            },
            admin,
          ),
        ).rejects.toThrow()
        expect((await balance(f)).quantityOnHand).toBe(10)
        expect(
          await inventory.getInventoryBalance(f.target.id, f.variant.id),
        ).toBeNull()
        expect(
          await db
            .select()
            .from(s.stockMovements)
            .where(eq(s.stockMovements.variantId, f.variant.id)),
        ).toHaveLength(0)
      } finally {
        await pool.query(
          'drop trigger phase1_transfer_failure on stock_movement; drop function phase1_transfer_failure()',
        )
      }
    })
    it('uses deterministic row order for opposite concurrent transfers', async () => {
      const f = await fixture(10)
      await inventory.transferStock(
        {
          operationId: id(),
          sourceLocationId: f.source.id,
          targetLocationId: f.target.id,
          variantId: f.variant.id,
          quantity: 5,
          note: 'Initial',
        },
        admin,
      )
      await Promise.all(
        Array.from({ length: 6 }, (_, index) =>
          inventory.transferStock(
            {
              operationId: id(),
              sourceLocationId: index % 2 ? f.source.id : f.target.id,
              targetLocationId: index % 2 ? f.target.id : f.source.id,
              variantId: f.variant.id,
              quantity: 1,
              note: 'Parallel opposite',
            },
            admin,
          ),
        ),
      )
      expect((await balance(f)).quantityOnHand).toBe(5)
      expect(
        (await inventory.getInventoryBalance(f.target.id, f.variant.id))
          .quantityOnHand,
      ).toBe(5)
    })
    it('allows only one buyer to reserve the last unit', async () => {
      const f = await fixture(1),
        a = await buyer(f),
        b = await buyer(f)
      const [pa, pb] = await Promise.all([payload(f, a), payload(f, b)])
      const rows = await Promise.allSettled([
        checkout.placeCheckout(a.user.id, pa),
        checkout.placeCheckout(b.user.id, pb),
      ])
      expect(rows.filter((row) => row.status === 'fulfilled')).toHaveLength(1)
      expect(rows.find((row) => row.status === 'rejected').reason.status).toBe(
        409,
      )
      expect((await balance(f)).quantityReserved).toBe(1)
    })
    it('serializes checkout with adjustment without overselling or overwriting reservations', async () => {
      const f = await fixture(1),
        b = await buyer(f),
        input = await payload(f, b)
      const rows = await Promise.allSettled([
        checkout.placeCheckout(b.user.id, input),
        inventory.createStockMovement(movement(f, -1, 'adjustment'), admin),
      ])
      expect(rows.filter((row) => row.status === 'fulfilled')).toHaveLength(1)
      const actual = await balance(f)
      expect(actual.quantityReserved).toBeLessThanOrEqual(actual.quantityOnHand)
      expect(actual.quantityOnHand - actual.quantityReserved).toBe(0)
    })
    it('keeps checkout/voucher/cart idempotency and releases stock once during simultaneous cancellation', async () => {
      const f = await fixture(5),
        b = await buyer(f)
      const [promo] = await db
        .insert(s.promotions)
        .values({
          name: 'Fixture',
          discountType: 'fixed',
          discountValue: '10000',
          startsAt: new Date(Date.now() - 60000),
          endsAt: new Date(Date.now() + 3600000),
        })
        .returning()
      const [code] = await db
        .insert(s.promotionCodes)
        .values({ promotionId: promo.id, code: id(), usageLimit: 1 })
        .returning()
      const input = await payload(f, b, 2, code.code)
      const placed = await checkout.placeCheckout(b.user.id, input)
      expect((await checkout.placeCheckout(b.user.id, input)).id).toBe(
        placed.id,
      )
      expect(
        (
          await db
            .select()
            .from(s.cartItems)
            .where(eq(s.cartItems.cartId, b.cart.id))
        )[0].quantity,
      ).toBe(1)
      await Promise.all([
        checkout.cancelCheckout(b.user.id, placed.id),
        checkout.cancelCheckout(b.user.id, placed.id),
      ])
      expect((await balance(f)).quantityReserved).toBe(0)
      expect(
        (
          await db
            .select()
            .from(s.promotionCodes)
            .where(eq(s.promotionCodes.id, code.id))
        )[0].usedCount,
      ).toBe(0)
      const rows = await db
        .select()
        .from(s.stockMovements)
        .where(
          and(
            eq(s.stockMovements.referenceId, placed.id),
            eq(s.stockMovements.type, 'release'),
          ),
        )
      expect(rows).toHaveLength(1)
      expect(
        (
          await db
            .select()
            .from(s.inventoryReservations)
            .where(eq(s.inventoryReservations.orderId, placed.id))
        )[0].state,
      ).toBe('released')
    })
    it('replays the original operation even if its warehouse was later deactivated', async () => {
      const f = await fixture(),
        input = movement(f, 2)
      const original = await inventory.createStockMovement(input, admin)
      await inventory.updateInventoryLocation(f.source.id, { isActive: false })
      expect((await inventory.createStockMovement(input, admin)).id).toBe(
        original.id,
      )
      await expect(
        inventory.createStockMovement({ ...input, quantity: 3 }, admin),
      ).rejects.toMatchObject({ status: 409 })
      expect((await balance(f)).quantityOnHand).toBe(12)
    })
    it('issues reserved stock exactly once when completing a COD order', async () => {
      const f = await fixture(5),
        b = await buyer(f)
      const placed = await checkout.placeCheckout(
        b.user.id,
        await payload(f, b, 2),
      )
      await order.changeOrderStatus(placed.id, { status: 'confirmed' })
      await order.changeOrderStatus(placed.id, { status: 'processing' })
      const fulfillment=await import('../src/services/fulfillment.js')
      await expect(order.changeOrderStatus(placed.id,{status:'completed'},admin)).rejects.toMatchObject({status:409})
      await fulfillment.shipmentCommand(placed.id,{commandId:id(),action:'prepare',note:'Prepare local fixture',carrier:'Fixture',trackingNumber:id()},admin)
      const handover={commandId:id(),action:'handover',note:'Handover local fixture'}
      await Promise.all([fulfillment.shipmentCommand(placed.id,handover,admin),fulfillment.shipmentCommand(placed.id,handover,admin)])
      await fulfillment.shipmentCommand(placed.id,{commandId:id(),action:'delivered',note:'Delivered local fixture',codProof:'Receipt fixture'},admin)
      expect(await balance(f)).toMatchObject({
        quantityOnHand: 3,
        quantityReserved: 0,
      })
      expect(
        (
          await db
            .select()
            .from(s.inventoryReservations)
            .where(eq(s.inventoryReservations.orderId, placed.id))
        )[0].state,
      ).toBe('issued')
      const issued = await db
        .select()
        .from(s.stockMovements)
        .where(
          and(
            eq(s.stockMovements.referenceId, placed.id),
            eq(s.stockMovements.type, 'issue'),
          ),
        )
      expect(issued).toHaveLength(1)
      expect(issued[0].actorId).toBe(admin.id)
    })
    it('exposes validated transfer/reconciliation and blocks forged stock writes or ledger edits', async () => {
      const f = await fixture()
      expect(
        (
          await request('/inventory/transfers', {
            cookie: 'user',
            method: 'POST',
            body: {},
          })
        ).status,
      ).toBe(403)
      for (const body of [
        { ...movement(f, 1), quantity: NaN },
        { ...movement(f, 1), quantity: 0 },
        { ...movement(f, 1), actorId: state.buyerId },
        { ...movement(f, 1), type: 'release' },
      ])
        expect(
          (
            await request('/inventory/stock/movement', {
              cookie: 'admin',
              method: 'POST',
              body,
            })
          ).status,
        ).toBe(400)
      const created = await request('/inventory/stock/movement', {
        cookie: 'admin',
        method: 'POST',
        body: movement(f, 1),
      })
      expect(created.status).toBe(201)
      expect(
        (
          await request(`/inventory/stock/movement/${created.data.id}`, {
            cookie: 'admin',
            method: 'DELETE',
          })
        ).status,
      ).toBe(404)
      expect(
        (
          await request('/inventory/transfers', {
            cookie: 'admin',
            method: 'POST',
            body: {
              operationId: id(),
              sourceLocationId: f.source.id,
              targetLocationId: f.source.id,
              variantId: f.variant.id,
              quantity: 1,
              note: 'Invalid',
            },
          })
        ).status,
      ).toBe(400)
      await db
        .update(s.inventoryBalances)
        .set({ quantityOnHand: 99 })
        .where(
          and(
            eq(s.inventoryBalances.locationId, f.source.id),
            eq(s.inventoryBalances.variantId, f.variant.id),
          ),
        )
      const report = await request('/inventory/reconciliation', {
        cookie: 'admin',
      })
      expect(report.status).toBe(200)
      expect(
        report.data.items.find((row) => row.locationId === f.source.id)
          .consistent,
      ).toBe(false)
      expect((await balance(f)).quantityOnHand).toBe(99)
    })
    it('repairs a checked physical count with an audited baseline and idempotent adjustment', async () => {
      const f = await fixture(10)
      await db
        .update(s.inventoryBalances)
        .set({ quantityOnHand: 12 })
        .where(
          and(
            eq(s.inventoryBalances.locationId, f.source.id),
            eq(s.inventoryBalances.variantId, f.variant.id),
          ),
        )
      const input = {
        operationId: id(),
        locationId: f.source.id,
        variantId: f.variant.id,
        expectedActualOnHand: 12,
        quantityOnHand: 11,
        note: 'Physical recount fixture',
      }
      const result = await inventory.reconcileStockBalance(input, admin)
      expect(result.movements[0]).toMatchObject({
        type: 'adjustment',
        onHandBefore: 12,
        onHandAfter: 11,
      })
      expect(result.baselineBefore.quantityOnHand).toBe(10)
      expect(result.baselineAfter.quantityOnHand).toBe(11)
      expect(
        (await inventory.reconcileStockBalance(input, admin)).operationId,
      ).toBe(result.operationId)
      expect(
        (await inventory.reconcileInventory()).items.find(
          (row) => row.locationId === f.source.id,
        ).consistent,
      ).toBe(true)
      await expect(
        inventory.reconcileStockBalance({ ...input, operationId: id() }, admin),
      ).rejects.toMatchObject({ status: 409 })
      const noChange = {
        ...input,
        operationId: id(),
        expectedActualOnHand: 11,
        quantityOnHand: 11,
      }
      const audit = await inventory.reconcileStockBalance(noChange, admin)
      expect(audit.movements).toHaveLength(0)
      expect(audit.baselineAfter.quantityOnHand).toBe(11)
      // Repair old orphan reserved counts only with an explicit checked adjustment.
      await db
        .update(s.inventoryBalances)
        .set({ quantityReserved: 2 })
        .where(
          and(
            eq(s.inventoryBalances.locationId, f.source.id),
            eq(s.inventoryBalances.variantId, f.variant.id),
          ),
        )
      await expect(
        inventory.reconcileStockBalance(
          { ...noChange, operationId: id() },
          admin,
        ),
      ).rejects.toMatchObject({ status: 409 })
      await expect(
        inventory.reconcileStockBalance(
          {
            ...noChange,
            operationId: id(),
            expectedActualReserved: 2,
            quantityReserved: 1,
          },
          admin,
        ),
      ).rejects.toMatchObject({ status: 409 })
      expect((await balance(f)).quantityReserved).toBe(2)
      const repaired = await inventory.reconcileStockBalance(
        {
          ...noChange,
          operationId: id(),
          expectedActualReserved: 2,
          quantityReserved: 0,
        },
        admin,
      )
      expect(repaired.movements[0]).toMatchObject({
        onHandDelta: 0,
        reservedDelta: -2,
        reservedBefore: 2,
        reservedAfter: 0,
      })
      expect(
        (await inventory.reconcileInventory()).items.find(
          (row) => row.locationId === f.source.id,
        ).consistent,
      ).toBe(true)
    })
  },
)
