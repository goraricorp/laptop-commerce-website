import process from 'node:process'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
const web = spawn(process.execPath, ['task', '--cwd', '../client', '--eval', 'vite --host 127.0.0.1 --port 5199 --strictPort'], { stdio: 'inherit', env: { ...process.env, VITE_PUBLIC_SERVER_URL: 'http://127.0.0.1:5172' } })
const stop = () => { if (!web.killed) web.kill('SIGTERM') }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (web.exitCode !== null) throw new Error('Browser test web server exited before startup')
    try { if ((await fetch('http://127.0.0.1:5199')).ok) { ready = true; break } } catch { /* startup probe */ }
    await delay(100)
  }
  if (!ready) throw new Error('Browser test web server did not start')
  const available=['admin-parity', 'admin-table-presentation', 'checkout', 'catalog', 'phase3', 'phase4', 'phase5']
  const requested=process.argv.slice(2)
  if(requested.some(suite=>!available.includes(suite)))throw new Error('Unknown browser suite')
  for (const suite of requested.length?requested:available) {
    // Browser suites intercept all API calls; no database, bucket, email or payments.
    const result = spawnSync('node', [`tests/browser/${suite}.mjs`], { stdio: 'inherit', timeout: 180000 })
    if (result.status !== 0) { process.exitCode = result.status ?? 1; break }
  }
} finally { stop() }
