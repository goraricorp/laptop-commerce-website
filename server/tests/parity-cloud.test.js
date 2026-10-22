import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { eq } from 'drizzle-orm'
import { GetObjectCommand } from '@aws-sdk/client-s3'
describe.skipIf(process.env.RUN_PARITY_CLOUD_TESTS !== 'true')('real database and storage parity (disposable fixtures only)', () => {
  let db, pool, s, checkout, review, storage, sdk, buyer, product, variant, address, location, cart, promo, code, imageKey
  const suffix = randomUUID()
  beforeAll(async () => {
    ;({ db, pool } = await import('../src/database/index.js'))
    s = await import('../src/database/schema.js')
    checkout = await import('../src/services/checkout.js')
    review = await import('../src/services/review.js')
    storage = await import('../src/services/storage.js')
    sdk = await import('../src/lib/upload/s3-client.js')
    ;[buyer] = await db.insert(s.user).values({ name: 'Parity disposable fixture', email: `parity-${suffix}@example.test`, emailVerified: true }).returning()
    ;[product] = await db.insert(s.products).values({ name: 'Parity fixture', slug: `parity-${suffix}`, status: 'active' }).returning()
    ;[variant] = await db.insert(s.productVariants).values({ productId: product.id, sku: `PARITY-${suffix}`, name: 'Test SKU', price: '200000', status: 'active' }).returning()
    ;[address] = await db.insert(s.addresses).values({ userId: buyer.id, recipientName: 'Fixture Buyer', phone: '0901234567', addressLine: '123 Fixture Street', district: 'Fixture', province: 'Fixture' }).returning()
    ;[location] = await db.insert(s.inventoryLocations).values({ code: `P-${suffix}`, name: 'Disposable parity location', type: 'warehouse' }).returning()
    await db.insert(s.inventoryBalances).values({ locationId: location.id, variantId: variant.id, quantityOnHand: 10 })
    ;[cart] = await db.insert(s.carts).values({ userId: buyer.id }).returning()
    await db.insert(s.cartItems).values({ cartId: cart.id, variantId: variant.id, quantity: 5, unitPrice: '200000' })
    ;[promo] = await db.insert(s.promotions).values({ name: 'Disposable voucher', discountType: 'fixed', discountValue: '20000', minimumOrderValue: '100000', startsAt: new Date(Date.now()-60000), endsAt: new Date(Date.now()+3600000) }).returning()
    ;[code] = await db.insert(s.promotionCodes).values({ promotionId: promo.id, code: `PARITY-${suffix}`, usageLimit: 2, usagePerUser: 1 }).returning()
  }, 30000)
  const quantity = async () => (await db.select().from(s.cartItems).where(eq(s.cartItems.cartId, cart.id)))[0]?.quantity ?? 0
  async function payload(provider='cod', count=1, voucherCode='') {
    const input={ items:[{variantId:variant.id,quantity:count}],addressId:address.id,provider,voucherCode }
    const quote=await checkout.quoteCheckout(buyer.id,input)
    return {requestKey:randomUUID(),quoteToken:quote.quoteToken,checkout:input}
  }
  it('cleans COD/online carts in server transactions and restores cancelled voucher usage only once', async () => {
    const request=await payload('cod',2,code.code)
    const order=await checkout.placeCheckout(buyer.id,request)
    expect(Number(order.discountTotal)).toBe(20000);expect(await quantity()).toBe(3)
    expect((await checkout.placeCheckout(buyer.id,request)).id).toBe(order.id);expect(await quantity()).toBe(3)
    await checkout.cancelCheckout(buyer.id,order.id);await checkout.cancelCheckout(buyer.id,order.id)
    expect((await db.select().from(s.promotionCodes).where(eq(s.promotionCodes.id,code.id)))[0].usedCount).toBe(0)
    expect(await db.select().from(s.promotionUsages).where(eq(s.promotionUsages.orderId,order.id))).toHaveLength(0)
    const online=await checkout.placeCheckout(buyer.id,await payload('stripe'))
    expect(await quantity()).toBe(3)
    const [session]=await db.update(s.checkoutSessions).set({providerOrderId:`cs_parity_${suffix}`}).where(eq(s.checkoutSessions.orderId,online.id)).returning()
    const result={state:'paid',providerId:session.providerOrderId,amount:session.providerAmount,currency:session.currency,transactionId:`capture-${suffix}`}
    await checkout.applyGatewayResult(session.id,result);await checkout.applyGatewayResult(session.id,result)
    expect(await quantity()).toBe(2)
    const failed=await checkout.placeCheckout(buyer.id,await payload('stripe',1,code.code))
    const [failedSession]=await db.select().from(s.checkoutSessions).where(eq(s.checkoutSessions.orderId,failed.id))
    await checkout.applyGatewayResult(failedSession.id,{state:'failed'});await checkout.applyGatewayResult(failedSession.id,{state:'failed'})
    expect((await db.select().from(s.promotionCodes).where(eq(s.promotionCodes.id,code.id)))[0].usedCount).toBe(0)
  },30000)
  it('rejects concurrent duplicate reviews and permits only the owner to edit/delete', async () => {
    const data={productId:product.id,userId:buyer.id,score:5,comment:'Disposable test',status:'pending'}
    const results=await Promise.allSettled([review.createProductReview(data),review.createProductReview(data)])
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1)
    expect(results.find(r=>r.status==='rejected').reason.status).toBe(409)
    const row=results.find(r=>r.status==='fulfilled').value
    expect(await review.updateOwnedReview(row.id,randomUUID(),{score:1})).toBeUndefined()
    expect((await review.updateOwnedReview(row.id,buyer.id,{score:4})).status).toBe('pending')
    expect((await review.deleteOwnedReview(row.id,buyer.id)).id).toBe(row.id)
  },30000)
  it('paginates actual order history with customer joins and reads order details', async () => {
    const { default: router } = await import('../src/routes/statistics.js')
    async function call(path, query, params = {}) {
      let body
      const res = { set() { return this }, status() { return this }, json(data) { body = data; return this } }
      const handler = router.stack.find(layer => layer.route?.path === path).route.stack.at(-1).handle
      await handler({ query, params }, res, error => { throw error })
      return body
    }
    const first = await call('/admin/statistics', { search: suffix, page: 1, limit: 1 })
    const second = await call('/admin/statistics', { search: suffix, page: 2, limit: 1 })
    expect(first.historyTotal).toBe(3)
    expect(first.recentOrders).toHaveLength(1)
    expect(first.recentOrders[0].customerEmail).toBe(buyer.email)
    expect(first.recentOrders[0].id).not.toBe(second.recentOrders[0].id)
    const detail = await call('/admin/statistics/orders/:id', {}, { id: second.recentOrders[0].id })
    expect(detail.customerName).toBe(buyer.name)
    expect(detail.items).toHaveLength(1)
    expect(detail.addresses[0].phone).toBe(address.phone)
  }, 30000)
  it('uploads a UUID image to the real bucket, keeps a saved reference, then deletes its orphan', async () => {
    imageKey=`public/users/${buyer.id}/${randomUUID()}.png`
    const url=`${process.env.VITE_PUBLIC_SERVER_URL.replace(/\/$/,'')}/storage/object?key=${encodeURIComponent(imageKey)}`
    const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64')
    await sdk.uploadObject(process.env.VITE_STORAGE_BUCKET||'public',imageKey,{buffer:bytes,mimetype:'image/png',size:bytes.length})
    await db.insert(s.uploadAssets).values({key:imageKey,url,userId:buyer.id})
    const object=await sdk.getStorageClient().send(new GetObjectCommand({Bucket:process.env.VITE_STORAGE_BUCKET||'public',Key:imageKey}))
    expect(Buffer.from(await object.Body.transformToByteArray()).equals(bytes)).toBe(true)
    const media=await storage.mutateWithAssets(s.productMedia,'create',null,{productId:product.id,url})
    expect(await storage.deleteAsset(imageKey,{id:buyer.id})).toMatchObject({deleted:false,referenced:true})
    await storage.mutateWithAssets(s.productMedia,'delete',media.id)
    expect(await db.select().from(s.uploadAssets).where(eq(s.uploadAssets.key,imageKey))).toHaveLength(0)
    imageKey=null
  },30000)
  afterAll(async () => {
    try {
      if(imageKey){await sdk.deleteObject(process.env.VITE_STORAGE_BUCKET||'public',imageKey).catch(()=>{});await db.delete(s.uploadAssets).where(eq(s.uploadAssets.key,imageKey))}
      if(buyer)await db.delete(s.orders).where(eq(s.orders.userId,buyer.id))
      if(promo)await db.delete(s.promotions).where(eq(s.promotions.id,promo.id))
      if(location){await db.delete(s.stockMovements).where(eq(s.stockMovements.locationId,location.id));await db.delete(s.inventoryBalances).where(eq(s.inventoryBalances.locationId,location.id))}
      if(product)await db.delete(s.products).where(eq(s.products.id,product.id))
      if(location)await db.delete(s.inventoryLocations).where(eq(s.inventoryLocations.id,location.id))
      if(buyer)await db.delete(s.user).where(eq(s.user.id,buyer.id))
    }finally{await pool?.end()}
  },30000)
})
