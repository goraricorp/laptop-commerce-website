import { z } from 'zod'

import { uuidSchema } from './common.js'

export const categoryBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(255),
  image: z.string().trim().max(2048).nullable().optional(),
})
export const updateCategorySchema = categoryBodySchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required')
export const categoryParamsSchema = z.object({ id: uuidSchema })
