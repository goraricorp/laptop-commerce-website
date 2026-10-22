export * from './after-sales.js'
export * from './auth.js'
export * from './catalog.js'
export * from './chat.js'
export * from './commerce.js'
export * from './core.js'
export * from './inventory.js'
export * from './operations.js'

import { afterSalesSchema } from './after-sales.js'
import { authSchema } from './auth.js'
import { catalogSchema } from './catalog.js'
import { chatSchema } from './chat.js'
import { commerceSchema } from './commerce.js'
import { coreSchema } from './core.js'
import { inventorySchema } from './inventory.js'
import { operationsSchema } from './operations.js'

export const schema = {
  ...authSchema,
  ...coreSchema,
  ...catalogSchema,
  ...inventorySchema,
  ...commerceSchema,
  ...afterSalesSchema,
  ...chatSchema,
  ...operationsSchema,
}
