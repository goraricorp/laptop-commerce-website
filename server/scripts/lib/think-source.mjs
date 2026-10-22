export function readNuxtData(html) {
  const match = html.match(/<script\b[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) throw new Error('Nuxt source data missing')
  const values = JSON.parse(match[1])
  const cache = new Map()
  function decode(index) {
    if (index < 0) return index === -1 ? undefined : null
    if (cache.has(index)) return cache.get(index)
    const value = values[index]
    if (value === null || typeof value !== 'object') return value
    if (Array.isArray(value) && typeof value[0] === 'string') {
      if (value[0] === 'Set') return value.slice(1).map(decode)
      if (!['Reactive', 'ShallowReactive', 'Ref', 'ShallowRef'].includes(value[0])) throw new Error(`Unsupported Nuxt type: ${value[0]}`)
      return decode(value[1])
    }
    const result = Array.isArray(value) ? [] : {}
    cache.set(index, result)
    for (const [key, ref] of Object.entries(value)) result[key] = decode(ref)
    return result
  }
  return decode(0).data
}

export function normalizeProduct(source, href, category) {
  if (!source?.product_id || !source.name || !Array.isArray(source.variants)) throw new Error('Product details missing')
  const validPrice = (value) => Number.isSafeInteger(value) && value >= 1000 ? value : null
  const variants = source.variants.map((variant) => ({
    sourceId: String(variant.sku_id), sku: variant.sku,
    name: variant.options?.map((option) => option.value).filter(Boolean).join(' · ') || variant.sku,
    options: variant.options || [], price: validPrice(variant.price),
    compareAtPrice: variant.sku_id === source.sku_id ? validPrice(source.price_before_discount) : null,
    available: variant.available === true, condition: variant.condition,
    specs: variant.sku_id === source.sku_id ? source.specifications || [] : [],
  }))
  const prices = variants.map((variant) => variant.price).filter((price) => price !== null)
  return { category, name: source.name, href, sourceId: source.product_id,
    price: prices.length ? Math.min(...prices) : null,
    compareAtPrice: validPrice(source.price_before_discount),
    image: source.gallery?.[0]?.url || source.gallery?.[0]?.src || null,
    fullName: source.seo?.title || source.name, variants, scrapedAt: new Date().toISOString() }
}
