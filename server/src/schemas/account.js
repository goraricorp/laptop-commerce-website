import { z } from 'zod'

export const profileBodySchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  image: z.string().trim().max(2048).nullable().optional(),
  firstName: z.string().trim().max(255).nullable().optional(),
  lastName: z.string().trim().max(255).nullable().optional(),
  phone: z.string().trim().regex(/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/, 'Invalid Vietnamese phone number').nullable().optional(),
  birthday: z.iso.date().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required')
