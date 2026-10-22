import { describe, expect, it } from 'vitest'
import { searchInput } from '../src/schemas/catalog-search.js'
import { cleanContent } from '../src/lib/catalog/content.js'
describe('catalog search and content contracts', () => {
  it('validates strict bounded query and price range', () => {
    for (const value of [
      { limit: 101 },
      { page: -1 },
      { minPrice: 10, maxPrice: 1 },
      { costPrice: true },
      { attributes: '{}x' },
      { sort: 'random' },
    ])
      expect(searchInput.safeParse(value).success).toBe(false)
    expect(searchInput.parse({})).toMatchObject({
      limit: 24,
      page: 1,
      sort: 'newest',
    })
  })
  it('keeps text literal and cleans dangerous HTML/parser edge cases', () => {
    expect(cleanContent({ content: '<b>text</b>' })).toEqual({
      format: 'plain',
      content: '<b>text</b>',
    })
    for (const content of [
      '<svg><script>alert(1)</script></svg>',
      '<a href="java&#x73;cript:alert(1)" onclick="x()">X</a>',
      '<math><mtext><img src=x onerror=x()></mtext></math>',
      '<style>body{display:none}</style><iframe srcdoc="<script>x()</script>"></iframe>',
    ])
      expect(cleanContent({ format: 'html', content }).content).not.toMatch(
        /script|onerror|onclick|<svg|<math|<style|iframe/i,
      )
  })
})
