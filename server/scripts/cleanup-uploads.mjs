import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { cleanupAssets } = await vite.ssrLoadModule('/src/services/storage.js')
  const results = await cleanupAssets()
  console.log(JSON.stringify({ checked: results.length, deleted: results.filter(result => result.deleted).length, retry: results.filter(result => result.retry).length }))
  const { pool } = await vite.ssrLoadModule('/src/database/index.js')
  await pool.end()
} finally { await vite.close() }
