import { z } from 'zod'

export const uuidSchema = z.uuid()
export const idParamsSchema = z.object({ id: uuidSchema })
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
