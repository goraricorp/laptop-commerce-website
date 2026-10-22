import {request as httpRequest} from './helpers/request.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
vi.mock('../src/lib/auth/index.js', () => ({
  auth: {
    api: {
      getSession: async ({ headers }) =>
        headers.get('cookie') === 'admin'
          ? {
              user: {
                id: '00000000-0000-4000-8000-000000000001',
                role: 'master',
              },
            }
          : null,
    },
    handler: vi.fn(),
  },
}))
const enabled = process.env.RUN_PHASE1_POSTGRES_TESTS === 'true'
let pool,
  app,
  categoryId,
  productId,
  firstSKU,
  secondSKU,
  attrs,
  values,
  brandId
const prefix = `P2-${randomUUID()}`
const request = async (path, body, method = 'GET') => {
  const response = await httpRequest(app,path, {
    method,
    headers: {
      cookie: 'admin',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { status: response.status, data: await response.json() }
}
const search = async (query) =>
  (await request('/catalog/search?' + new URLSearchParams(query))).data

describe.skipIf(!enabled)(
  'Phase 2: real PostgreSQL catalog larger than historical limits',
  () => {
    beforeAll(async () => {
      if (
        new URL(process.env.PHASE1_DATABASE_URL).hostname !== '127.0.0.1' ||
        process.env.DATABASE_URL !== process.env.PHASE1_DATABASE_URL
      )
        throw new Error('Disposable local database required')
      ;({ pool } = await import('../src/database/index.js'))
      app = (await import('../src/module.js')).default()
      categoryId = (
        await pool.query(
          'insert into category(name,slug) values($1,$1) returning id',
          [prefix],
        )
      ).rows[0].id
      brandId = (
        await pool.query(
          'insert into brand(name,slug) values($1,$1) returning id',
          [prefix],
        )
      ).rows[0].id
      await pool.query(
        `insert into product(category_id,brand_id,name,slug) select $1,$2,$3||'-'||lpad(i::text,3,'0'),$3||'-'||i from generate_series(1,240) i`,
        [categoryId, brandId, prefix],
      )
      await pool.query(
        `insert into product_variant(product_id,sku,name,price,cost_price,barcode) select p.id,p.slug||'-'||i,'SKU '||i,1000+right(p.name,3)::int*10+(i-1)*500,33,'PRIVATE-'||p.slug||'-'||i from product p cross join generate_series(1,2) i where p.category_id=$1`,
        [categoryId],
      )
      productId = (
        await pool.query(
          'select id from product where category_id=$1 order by name limit 1',
          [categoryId],
        )
      ).rows[0].id
      const skus = (
        await pool.query(
          'select id from product_variant where product_id=$1 order by price',
          [productId],
        )
      ).rows
      firstSKU = skus[0].id
      secondSKU = skus[1].id
      attrs = []
      values = []
      for (const [index, name] of ['cpu', 'ram', 'color'].entries()) {
        const attribute = (
          await pool.query(
            'insert into attribute(name,code) values($1,$1) returning id,code',
            [prefix + '-' + name],
          )
        ).rows[0]
        attrs.push(attribute)
        const pair = (
          await pool.query(
            'insert into attribute_value(attribute_id,value,metadata) values($1,$2,$4),($1,$3,$4) returning id,value',
            [
              attribute.id,
              ['Core i5', '8 GB', 'Đen'][index],
              ['Core i7', '16 GB', 'Bạc'][index],
              JSON.stringify({ private: 'SECRET' }),
            ],
          )
        ).rows
        values.push(pair)
        await pool.query(
          'insert into variant_attribute_value(variant_id,attribute_value_id) values($1,$2),($3,$4)',
          [firstSKU, pair[0].id, secondSKU, pair[1].id],
        )
      }
    }, 30000)
    afterAll(async () => {
      await pool?.end()
    })
    it('finds all 240 products / 480 SKUs, searches beyond old caps and paginates stable IDs', async () => {
      const pages = await Promise.all(
        [1, 2, 3].map((page) =>
          search({ categoryId, limit: 100, page, sort: 'name' }),
        ),
      )
      expect(pages.map((page) => page.items.length)).toEqual([100, 100, 40])
      expect(
        new Set(pages.flatMap((page) => page.items.map((item) => item.id)))
          .size,
      ).toBe(240)
      expect(pages.every((page) => page.total === 240)).toBe(true)
      const result = await search({ q: prefix + '-240' })
      expect(result.total).toBe(1)
      expect(result.items[0].variant.price).toBe(3400)
      expect(JSON.stringify(result)).not.toMatch(
        /costPrice|barcode|metadata|SECRET/,
      )
    })
    it('uses OR within a group, AND between groups on one SKU, including selected-SKU price/media', async () => {
      const make = (entries, extra = {}) =>
        search({
          categoryId,
          attributes: JSON.stringify(Object.fromEntries(entries)),
          ...extra,
        })
      expect(
        (
          await make([
            [attrs[0].code, [values[0][0].id]],
            [attrs[1].code, [values[1][1].id]],
          ])
        ).total,
      ).toBe(0)
      await pool.query(
        'insert into product_media(product_id,variant_id,url) values($1,$2,$3)',
        [productId, secondSKU, 'https://example.test/sku2.webp'],
      )
      const result = await make([
        [attrs[0].id, values[0].map((value) => value.id)],
        [attrs[1].code, [values[1][1].id]],
        [attrs[2].code, [values[2][1].id]],
      ])
      expect(result.total).toBe(1)
      expect(result.items[0].variant.id).toBe(secondSKU)
      expect(result.items[0].variant.price).toBe(1510)
      expect(result.items[0].media.url).toBe('https://example.test/sku2.webp')
      expect(
        (await make([[attrs[1].code, [values[1][1].id]]], { maxPrice: 1500 }))
          .total,
      ).toBe(0)
      expect(
        result.facets.attributes.find((item) => item.id === attrs[2].id).values,
      ).toHaveLength(2)
    })
    it('filters real categories, brand, price bounds and stable sorting; rejects invalid input', async () => {
      const result = await search({
        categoryId,
        brandId,
        minPrice: 1100,
        maxPrice: 1200,
        sort: 'price-desc',
      })
      expect(result.total).toBe(11)
      expect(result.items[0].variant.price).toBe(1200)
      expect(result.items.at(-1).variant.price).toBe(1100)
      expect(
        (await request('/catalog/search?minPrice=10&maxPrice=1')).status,
      ).toBe(400)
      expect((await request('/catalog/search?attributes=broken')).status).toBe(
        400,
      )
      expect((await request('/catalog/search?sort=sql-injection')).status).toBe(
        400,
      )
      expect((await search({ q: '%' })).total).toBe(0)
      expect((await search({ q: "' OR true --" })).total).toBe(0)
    })
    it('uses stable SKU/product ID ties and excludes inactive brand/category scopes', async () => {
      await pool.query('update product_variant set price=1010 where id=$1', [
        secondSKU,
      ])
      const tie = await search({ q: prefix + '-001' })
      expect(tie.items[0].variant.id).toBe([firstSKU, secondSKU].sort()[0])
      await pool.query('update product_variant set price=1510 where id=$1', [
        secondSKU,
      ])
      await pool.query('update brand set is_active=false where id=$1', [
        brandId,
      ])
      expect((await search({ categoryId })).total).toBe(0)
      expect((await request(`/product/${productId}/details`)).status).toBe(404)
      await pool.query('update brand set is_active=true where id=$1', [brandId])
      const root = (
        await pool.query(
          'insert into category(name,slug) values($1,$1) returning id',
          [prefix + '-root'],
        )
      ).rows[0].id
      await pool.query('update category set parent_id=$1 where id=$2', [
        root,
        categoryId,
      ])
      expect((await search({ type: prefix + '-root' })).total).toBe(240)
      await pool.query('update category set is_active=false where id=$1', [
        root,
      ])
      expect((await search({ categoryId })).total).toBe(0)
      await pool.query('update category set is_active=true where id=$1', [root])
    })
    it('returns only aggregate availability from active warehouses and all current SKU attributes/media', async () => {
      const location = (
        await pool.query(
          'insert into inventory_location(code,name,is_active) values($1,$1,false) returning id',
          [prefix],
        )
      ).rows[0].id
      await pool.query(
        'insert into inventory_balance(location_id,variant_id,quantity_on_hand,quantity_reserved) values($1,$2,9,1)',
        [location, secondSKU],
      )
      expect(
        (await request(`/product/${productId}/details`)).data.variants.find(
          (item) => item.id === secondSKU,
        ).available,
      ).toBe(false)
      await pool.query(
        'update inventory_location set is_active=true where id=$1',
        [location],
      )
      const details = (await request(`/product/${productId}/details`)).data
      expect(details.variants).toHaveLength(2)
      expect(
        details.variants.find((item) => item.id === secondSKU),
      ).toMatchObject({
        available: true,
        attributes: expect.arrayContaining([
          expect.objectContaining({ value: '16 GB' }),
        ]),
      })
      expect(JSON.stringify(details)).not.toMatch(
        /costPrice|barcode|quantityOnHand|locationId|metadata/,
      )
    })
    it('sanitizes explicit HTML on write and old data on read; plain content stays plain and ordered', async () => {
      const dirty =
        '<h2>Thông số</h2><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">X</a><iframe src="https://evil.test"></iframe><p onclick="alert(1)">Safe</p>'
      const saved = await request(
        '/admin/catalog/product-content-sections',
        { productId, format: 'html', content: dirty, position: 2 },
        'POST',
      )
      expect(saved.status).toBe(201)
      expect(saved.data.content).toContain('<h2>Thông số</h2>')
      expect(saved.data.content).not.toMatch(
        /script|onclick|onerror|iframe|javascript/,
      )
      await pool.query(
        'insert into product_content_section(product_id,content,format,position) values($1,$2,$3,1)',
        [productId, dirty, 'html'],
      )
      const plain = await request(
        '/admin/catalog/product-content-sections',
        { productId, content: '<b>literal</b>', position: 0 },
        'POST',
      )
      expect(plain.data.format).toBe('plain')
      const details = (await request(`/product/${productId}/details`)).data
      expect(
        details.contentSections.map((section) => section.position),
      ).toEqual([0, 1, 2])
      expect(details.contentSections[0].content).toBe('<b>literal</b>')
      expect(details.contentSections[1].content).not.toMatch(
        /script|onclick|onerror|iframe|javascript/,
      )
      expect(
        (await request(`/product/content/${details.contentSections[1].id}`))
          .data.content,
      ).not.toMatch(/script|onclick|onerror|iframe|javascript/)
    })
    it('shows actual active campaign/promotion dates, suppresses expired promotions and validates admin date ranges', async () => {
      const campaign = {
        title: prefix,
        imageUrl: 'https://example.test/banner.webp',
        productId,
        startsAt: new Date(Date.now() - 60000).toISOString(),
        endsAt: new Date(Date.now() + 60000).toISOString(),
      }
      const saved = await request('/admin/catalog/campaigns', campaign, 'POST')
      expect(saved.status).toBe(201)
      const result = (await request('/catalog/campaigns')).data.items.find(
        (item) => item.id === saved.data.id,
      )
      expect(result).toMatchObject({
        title: prefix,
        promotion: null,
        productId,
      })
      expect(
        (
          await request(
            '/admin/catalog/campaigns',
            { ...campaign, endsAt: campaign.startsAt },
            'POST',
          )
        ).status,
      ).toBe(400)
      const promotion = (
        await pool.query(
          "insert into promotion(name,discount_value,starts_at,ends_at) values($1,500,now()-interval '2 days',now()-interval '1 day') returning id",
          [prefix],
        )
      ).rows[0].id
      await pool.query(
        'update storefront_campaign set promotion_id=$1 where id=$2',
        [promotion, saved.data.id],
      )
      expect(
        (await request('/catalog/campaigns')).data.items.some(
          (item) => item.id === saved.data.id,
        ),
      ).toBe(false)
      await pool.query(
        "update promotion set ends_at=now()+interval '1 day' where id=$1",
        [promotion],
      )
      expect(
        (await request('/catalog/campaigns')).data.items.find(
          (item) => item.id === saved.data.id,
        ).promotion.discountValue,
      ).toBe(500)
      await pool.query("update product set status='draft' where id=$1", [
        productId,
      ])
      expect(
        (await request('/catalog/campaigns')).data.items.some(
          (item) => item.id === saved.data.id,
        ),
      ).toBe(false)
      expect((await request(`/product/${productId}/details`)).status).toBe(404)
      await pool.query("update product set status='active' where id=$1", [
        productId,
      ])
    })
    it('computes seven-day spotlight from paid completed sales, excluding returned/unpaid/old orders', async () => {
      for (const [status, payment, quantity, old] of [
        ['completed', 'paid', 100000, false],
        ['returned', 'paid', 999999, false],
        ['completed', 'unpaid', 999999, false],
        ['completed', 'paid', 999999, true],
      ]) {
        const order = (
          await pool.query(
            'insert into sales_order(code,subtotal,grand_total,order_status,payment_status,updated_at) values($1,1000,1000,$2,$3,$4) returning id',
            [
              randomUUID(),
              status,
              payment,
              new Date(Date.now() - (old ? 8 * 86400000 : 0)),
            ],
          )
        ).rows[0].id
        await pool.query(
          'insert into sales_order_item(order_id,variant_id,sku,product_name,variant_name,unit_price,quantity,total) values($1,$2,$3,$3,$3,1000,$4,1000)',
          [order, firstSKU, prefix, quantity],
        )
      }
      const item = (await request('/catalog/spotlight')).data.items.find(
        (row) => row.id === productId,
      )
      expect(item.soldUnits).toBe(100000)
    })
  },
)
