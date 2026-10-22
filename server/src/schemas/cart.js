import { z } from 'zod'

import { uuidSchema } from './common.js'

export const cartItemBodySchema = z.object({
  productId: uuidSchema.nullable().optional(),
  colorId: uuidSchema.nullable().optional(),
  configurationId: uuidSchema.nullable().optional(),
  accessoryId: uuidSchema.nullable().optional(),
  quantity: z.coerce.number().int().positive().default(1),
}).refine((value) => value.productId || value.accessoryId, 'A product or accessory is required')
export const updateCartItemSchema = z.object({
  id: uuidSchema,
  quantity: z.coerce.number().int().positive(),
})
export const removeCartItemSchema = z.object({ id: uuidSchema })
