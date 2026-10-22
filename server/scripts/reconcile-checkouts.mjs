import process from 'node:process'
import { reconcileExpiredCheckouts } from '../src/services/checkout.js'
import { pool } from '../src/database/index.js'
try {
  const results = await reconcileExpiredCheckouts()
  console.log(JSON.stringify(results))
  if (results.some(result => !result.ok)) process.exitCode = 1
} finally { await pool.end() }
