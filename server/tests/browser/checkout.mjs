import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import process from 'node:process'
const origin = 'http://127.0.0.1:5199', api = 'http://127.0.0.1:5172'
const buyer = { id: '00000000-0000-4000-8000-000000000001', name: 'Checkout Browser Test', email: 'browser@example.com', phone: '0901234567', emailVerified: true, role: 'user' }
const variantId = '00000000-0000-4000-8000-000000000002'
const orderId = '00000000-0000-4000-8000-000000000003'
const addressId = '00000000-0000-4000-8000-000000000004'
const address = { id: addressId, userId: buyer.id, recipientName: buyer.name, phone: buyer.phone, addressLine: '24 Test street', ward: 'Test ward', district: 'Test district', province: 'Test province', country: 'Việt Nam', isDefault: true }
const methods = ['cod', 'momo', 'zalopay', 'vnpay', 'paypal', 'stripe'].map(id => ({ id, enabled: id !== 'vnpay', hidden: id === 'vnpay' }))
const browser = await chromium.launch({ headless: true })
try {
  for (const scenario of ['cod', 'momo', 'zalopay', 'paypal', 'stripe', 'stripe-retry']) {
    const provider = scenario === 'stripe-retry' ? 'stripe' : scenario
    let payCalls = 0
    const page = await browser.newPage({ viewport: { width: provider === 'stripe' ? 390 : 1280, height: 900 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    let cart = [{ id: variantId, productId: variantId, variantId, name: 'Browser test laptop', variantName: 'Test', price: 200000, quantity: 1, selected: true }]
    let placed = 0, quoted, order
    let book = [address], chosenAddressId = addressId
    await page.addInitScript(({ variantId }) => localStorage.setItem('webkitlab-cart', JSON.stringify([{ id: variantId, productId: variantId, variantId, name: 'Browser test laptop', variantName: 'Test', price: 200000, quantity: 1, selected: true }])), { variantId })
    await page.route(`${api}/**`, async route => {
      const request = route.request()
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type,Authorization' } })
      const url = new URL(request.url()), path = url.pathname
      let body = { items: [], total: 0, page: 1, limit: 20 }
      if (path === '/catalog/search') body = { ...body, facets: { brands: [], categories: [], attributes: [] } }
      if (path === '/auth/get-session') body = { user: buyer, session: { id: 'fixture-session', userId: buyer.id, expiresAt: '2030-01-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', token: 'fixture' } }
      if (path === '/me/cart' || path === '/me/cart/merge') body = cart
      if (path === `/me/cart/items/${variantId}` && request.method() === 'DELETE') { cart = []; body = cart }
      if (path === '/me/addresses') {
        if (request.method() === 'POST') { const data = request.postDataJSON(); assert.equal('userId' in data, false); chosenAddressId = '00000000-0000-4000-8000-000000000005'; body = { ...data, id: chosenAddressId, userId: buyer.id }; book = [body, ...book] } else body = book
      }
      if (path === '/me/vouchers') body = provider === 'cod' ? [{ id: addressId, code: 'SAVE20', name: 'Voucher thật', state: 'available' }] : []
      if (path === '/checkout/methods') body = methods
      if (path === '/checkout/quote') {
        quoted = request.postDataJSON()
        assert.equal(quoted.addressId, chosenAddressId)
        assert.deepEqual(quoted.items, [{ variantId, quantity: 1 }])
        assert.equal(quoted.provider, provider)
        assert.equal(quoted.voucherCode, provider === 'cod' ? 'SAVE20' : '')
        assert.equal('grandTotal' in quoted, false)
        body = { subtotal: 200000, discount: provider === 'cod' ? 20000 : 0, shipping: 0, grandTotal: provider === 'cod' ? 180000 : 200000, providerAmount: '200000.00', providerCurrency: 'VND', quoteToken: 'a'.repeat(64) }
      }
      if (path === '/checkout/orders') {
        placed++
        const input = request.postDataJSON()
        assert.match(input.requestKey, /^[0-9a-f-]{36}$/)
        assert.equal(input.quoteToken, 'a'.repeat(64))
        order = { id: orderId, code: 'BROWSER-TEST', orderStatus: provider === 'cod' ? 'confirmed' : 'pending', paymentStatus: 'unpaid', subtotal: '200000', shippingTotal: '0', discountTotal: provider === 'cod' ? '20000' : '0', grandTotal: provider === 'cod' ? '180000' : '200000', address: book.find(item => item.id === chosenAddressId), items: [{ id: 'item', variantId, productName: 'Browser test laptop', variantName: 'Test', quantity: 1, unitPrice: '200000' }], payment: { provider, state: provider === 'cod' ? 'ready' : 'created', amount: '200000', currency: 'VND', url: null } }
        body = order
      }
      if (path === `/me/orders/${orderId}` || path === `/checkout/orders/${orderId}/refresh`) body = order
      if (path === `/checkout/orders/${orderId}/pay` && scenario === 'stripe-retry' && ++payCalls === 1) return route.fulfill({ status: 502, headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true' }, body: JSON.stringify({ message: 'Sandbox gateway unavailable' }) })
      if (path === `/checkout/orders/${orderId}/pay`) body = { ...order, payment: { ...order.payment, state: 'ready', url: 'https://checkout.stripe.com/c/pay/browser-test' } }
      return route.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true' }, body: JSON.stringify(body) })
    })
    await page.route('https://checkout.stripe.com/**', route => route.fulfill({ status: 200, body: '<h1>Sandbox gateway navigation verified</h1>', contentType: 'text/html' }))
    await page.goto(`${origin}/purchase`)
    await page.getByRole('button', { name: 'Chọn địa chỉ nhận hàng', exact: true }).click()
    await page.getByText('Chọn từ sổ địa chỉ', { exact: true }).waitFor()
    assert.equal(await page.locator('input[name="address"]').count(), 0)
    assert.equal(await page.locator('input[name="city"]').count(), 0)
    if (provider === 'cod') {
      await page.getByRole('button', { name: 'Thêm địa chỉ', exact: true }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Số nhà, tên đường').fill('456 Browser test avenue')
      await dialog.getByLabel('Quận / huyện').fill('Test district')
      await dialog.getByLabel('Tỉnh / thành phố').fill('Test province')
      await dialog.getByRole('button', { name: 'Lưu địa chỉ', exact: true }).click()
      await dialog.waitFor({ state: 'hidden' })
      await page.getByText('456 Browser test avenue', { exact: false }).waitFor()
    }
    if (provider === 'cod') { await page.getByLabel('Chọn voucher', { exact: true }).selectOption('SAVE20'); assert.equal(await page.getByLabel('Mã giảm giá', { exact: true }).inputValue(), 'SAVE20') }
    await page.getByRole('button', { name: 'Chọn thanh toán', exact: true }).click()
    await page.getByText('Chọn phương thức thanh toán bạn muốn sử dụng.', { exact: true }).waitFor()
    assert.equal(await page.getByText('VNPAY', { exact: true }).count(), 0)
    for (const label of ['MoMo', 'ZaloPay', 'PayPal', 'Stripe', 'Thanh toán khi nhận hàng']) assert.equal(await page.getByText(label, { exact: true }).count() > 0, true)
    if (provider !== 'cod') await page.getByText(({ momo: 'MoMo', zalopay: 'ZaloPay', paypal: 'PayPal', stripe: 'Stripe' })[provider], { exact: true }).click()
    await page.getByRole('button', { name: 'Kiểm tra thông tin', exact: true }).click()
    await page.getByRole('button', { name: 'Đặt hàng', exact: true }).click()
    assert.equal(placed, 1)
    if (provider === 'cod') await page.getByText('Đã đặt hàng. Thanh toán khi nhận hàng.', { exact: true }).waitFor()
    else {
      if (scenario === 'stripe-retry') {
        await page.getByRole('heading', { name: 'Đơn hàng #BROWSER-TEST' }).waitFor()
        await page.getByText('Sandbox gateway unavailable', { exact: true }).waitFor()
        await page.getByRole('button', { name: 'Thanh toán ngay', exact: true }).click()
      }
      await page.getByRole('heading', { name: 'Sandbox gateway navigation verified' }).waitFor()
      assert.equal(placed, 1)
    }
    assert.deepEqual(errors, [])
    process.stdout.write(`PASS browser checkout: saved address, hidden VNPAY, server quote and ${scenario}\n`)
    await page.close()
  }
} finally { await browser.close() }
