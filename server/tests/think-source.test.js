import { describe, expect, it } from 'vitest'
import { normalizeProduct, readNuxtData } from '../scripts/lib/think-source.mjs'

describe('ThinkPro source extraction', () => {
  it('decodes Nuxt references instead of reading numbers from product titles', () => {
    const data = [['ShallowReactive', 1], { data: 2 }, ['ShallowReactive', 3], { 'product:test:': 4 }, { name: 5, price: 6 }, 'Laptop i7 16GB', 27990000]
    expect(readNuxtData(`<script id="__NUXT_DATA__">${JSON.stringify(data)}</script>`)['product:test:'].price).toBe(27990000)
  })
  it('keeps SKU prices and configurations separate', () => {
    const product = normalizeProduct({ product_id: 'p1', name: 'Laptop', sku_id: 1, price_before_discount: 30000000, variants: [
      { sku_id: 1, sku: 'A', price: 27000000, available: true, options: [{ type: 'Phiên bản', value: 'i7 32GB 512GB' }] },
      { sku_id: 2, sku: 'B', price: 29000000, available: false, options: [{ type: 'Phiên bản', value: 'i7 32GB 1TB' }] },
    ] }, 'https://thinkpro.vn/laptop/test', 'Laptop')
    expect(product.variants.map(row => row.price)).toEqual([27000000, 29000000])
    expect(product.variants[1].compareAtPrice).toBeNull()
    expect(product.variants[0].name).toBe('i7 32GB 512GB')
  })
  it('rejects malformed source and never promotes a model number to a sale price', () => {
    expect(() => normalizeProduct({}, '', '')).toThrow()
    expect(normalizeProduct({ product_id: 'p', name: 'Laptop', variants: [{ sku_id: 1, price: 16 }] }, '', '').variants[0].price).toBeNull()
  })
})
