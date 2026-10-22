import { z } from 'zod'

import { uuidSchema } from './common.js'

export const orderItemSchema = z.object({
  productId: uuidSchema.nullable().optional(),
  colorId: uuidSchema.nullable().optional(),
  configurationId: uuidSchema.nullable().optional(),
  accessoryId: uuidSchema.nullable().optional(),
  productName: z.string().trim().min(1).max(255),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative(),
})
export const createOrderSchema = z.object({
  addressId: uuidSchema.nullable().optional(),
  discountId: uuidSchema.nullable().optional(),
  price: z.coerce.number().nonnegative(),
  items: z.array(orderItemSchema).min(1),
})
export const orderParamsSchema = z.object({ id: uuidSchema })
