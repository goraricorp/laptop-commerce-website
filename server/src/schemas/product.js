import { z } from 'zod'

import { paginationQuerySchema, uuidSchema } from './common.js'

export const productBodySchema = z.object({
  categoryId: uuidSchema.nullable().optional(),
  brandId: uuidSchema.nullable().optional(),
  name: z.string().trim().min(1).max(255),
  image: z.string().trim().min(1).max(2048),
  status: z.coerce.number().int().min(0).max(1).default(1),
  type: z.string().trim().min(1).max(64).default('office'),
})
export const updateProductSchema = productBodySchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required')
export const productParamsSchema = z.object({ idproduct: uuidSchema })
export const productQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(255).optional(),
  brand: z.string().trim().max(255).optional(),
  categoryId: uuidSchema.optional(),
  status: z.coerce.number().int().min(0).max(1).optional(),
})
export const ratingBodySchema = z.object({
  productId: uuidSchema,
  score: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1023).nullable().optional(),
})
export const updateRatingSchema = ratingBodySchema.omit({ productId: true }).partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required')
