import fs from 'node:fs/promises'
import process from 'node:process'
import { readNuxtData, normalizeProduct } from './lib/think-source.mjs'

const BASE = 'https://thinkpro.vn'
const DATA_FILE = new URL('./think-data.json', import.meta.url)
const CATEGORIES = [
  ['Laptop', 'laptop', 'laptop', 100], ['Màn hình', 'monitor', 'man-hinh', 100],
  ['Màn hình di động', 'portable-monitor', 'man-hinh-di-dong', 4],
  ['Bàn phím', 'keyboard', 'ban-phim', 4], ['Chuột', 'mouse', 'chuot', 4],
  ['Arm màn hình', 'monitor-arm', 'arm-man-hinh', 4], ['Cổng chuyển', 'hub-adapter', 'cong-chuyen', 4],
  ['Sạc', 'charger', 'sac', 4], ['Balo', 'backpack', 'balo', 4], ['Loa', 'speaker', 'am-thanh', 4],
  ['RAM', 'ram', 'ram', 4], ['Ổ cứng', 'storage', 'o-cung', 4],
  ['Ghế công thái học', 'ergonomic-chair', 'ghe-cong-thai-hoc', 4],
  ['Bàn nâng hạ', 'standing-desk', 'ban-nang-ha', 4], ['Máy chơi game', 'game-console', 'may-choi-game', 4],
]
async function load(url) {
  const target = new URL(url, BASE)
  if (target.origin !== BASE) throw new Error('Unexpected source origin')
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(target, { signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return readNuxtData(await response.text())
    } catch (error) { if (attempt === 2) throw error }
  }
}
async function main() {
  const data = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'))
  await fs.copyFile(DATA_FILE, new URL(`./think-data.backup-${Date.now()}.json`, import.meta.url))
  let success = 0, failed = 0
  for (const [name, slug, path, limit] of CATEGORIES) {
    if (process.argv.includes('--laptop-only') && slug !== 'laptop') continue
    // Refresh known product URLs first, retaining DB identity and excluding navigation links.
    const known = (data[slug] || []).filter((item) => new URL(item.href).pathname.startsWith(`/${path}/`))
    const candidates = new Map(known.map((item) => [item.href.split('?')[0], item]))
    try {
      for (let page = 1; candidates.size < limit && page <= 10; page++) {
        const state = await load(`${BASE}/${path}?page=${page}`)
        const before = candidates.size
        const visit = (value) => {
          if (!value || typeof value !== 'object') return
          if (value.product_id && value.shared_url) {
            const href = new URL(value.shared_url, BASE).href.split('?')[0]
            if (new URL(href).pathname.startsWith(`/${path}/`) && candidates.size < limit) candidates.set(href, { name: value.name, href, image: value.image })
            return
          }
          for (const child of Object.values(value)) visit(child)
        }
        for (const [key, value] of Object.entries(state)) if (key.startsWith('category:')) visit(value)
        if (candidates.size === before) break
      }
    } catch (error) { console.warn(`${slug}: category discovery failed (${error.message}); using known URLs`) }
    const output = []
    for (const [href, previous] of candidates) {
      try {
        const state = await load(href)
        const source = Object.entries(state).find(([key]) => key.startsWith('product:'))?.[1]
        const item = normalizeProduct(source, href, name)
        item.image ||= previous.image || null
        output.push(item)
        success++
        console.log(`${slug}: ${item.name} — ${item.variants.length} variants, ${item.price ?? 'no price'}`)
      } catch (error) {
        failed++
        output.push({ ...previous, scrapeError: error.message })
        console.warn(`${slug}: ${href}: ${error.message}`)
      }
    }
    if (output.length) data[slug] = output
    const temp = new URL('./think-data.json.tmp', import.meta.url)
    await fs.writeFile(temp, JSON.stringify(data, null, 2) + '\n')
    await fs.rename(temp, DATA_FILE)
  }
  console.log(JSON.stringify({ success, failed }))
  if (failed) process.exitCode = 1
}
main().catch((error) => { console.error(error.message); process.exitCode = 1 })
