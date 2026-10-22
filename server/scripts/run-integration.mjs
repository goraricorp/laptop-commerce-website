import process from 'node:process'
import { spawnSync } from 'node:child_process'
if (process.env.CLOUD_TESTS_APPROVED !== 'true') {
  console.error('Refusing cloud writes: set CLOUD_TESTS_APPROVED=true only after the exact database and disposable-fixture scope have been approved. No tests ran.')
  process.exit(2)
}
const suites = [
  ['RUN_CLOUD_AUTH_TESTS', 'tests/auth-cloud.test.js'],
  ['RUN_CLOUD_CHECKOUT_TESTS', 'tests/checkout-cloud.test.js'],
  ['RUN_PARITY_CLOUD_TESTS', 'tests/parity-cloud.test.js'],
].filter(([flag]) => process.env[flag] === 'true').map(([, file]) => file)
if (!suites.length) { console.error('Select at least one RUN_*_TESTS flag.'); process.exit(2) }
const result = spawnSync(process.execPath, ['task', '--eval', `vitest run ${suites.join(' ')}`], { stdio: 'inherit' })
process.exit(result.status ?? 1)
