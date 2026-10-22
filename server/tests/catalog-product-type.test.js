import { expect, it } from 'vitest'
import { productTypeForCategory } from '../src/lib/catalog/product-type.js'
it('derives the storefront type from categories after removing product_type from DB', () => {
  const categories = [{ id: 'a', slug: 'laptop' }, { id: 'b', slug: 'gaming', parentId: 'a' }, { id: 'c', slug: 'ram' }]
  expect(productTypeForCategory('b', categories)).toBe('laptop')
  expect(productTypeForCategory('c', categories)).toBe('component')
  expect(productTypeForCategory(null, categories)).toBe('other')
  expect(productTypeForCategory('x', [{ id: 'x', slug: 'unknown', parentId: 'x' }])).toBe('other')
})
