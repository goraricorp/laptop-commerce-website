const types = { laptop: 'laptop', monitor: 'monitor', 'portable-monitor': 'monitor', 'man-hinh': 'monitor', ram: 'component', storage: 'component', 'linh-kien': 'component', accessory: 'accessory', 'phu-kien': 'accessory', keyboard: 'accessory', mouse: 'accessory', 'monitor-arm': 'accessory', 'hub-adapter': 'accessory', charger: 'accessory', backpack: 'accessory', speaker: 'accessory' }

// Compatibility field for the storefront; category is the source of truth.
export function productTypeForCategory(categoryId, categories) {
  const visited = new Set()
  while (categoryId && !visited.has(categoryId)) {
    visited.add(categoryId)
    const category = categories.find(row => row.id === categoryId)
    if (types[category?.slug]) return types[category.slug]
    categoryId = category?.parentId
  }
  return 'other'
}
