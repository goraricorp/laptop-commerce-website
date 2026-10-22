import { z } from 'zod'

export const messageBodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
})
