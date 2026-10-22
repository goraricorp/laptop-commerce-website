import { z } from 'zod'

import { uuidSchema } from './common.js'

export const addressBodySchema = z.object({
  type: z.string().trim().min(1).max(15),
  tower: z.string().trim().min(1).max(255),
  street: z.string().trim().min(1).max(255),
  district: z.string().trim().min(1).max(255),
  city: z.string().trim().min(1).max(255),
  state: z.string().trim().min(1).max(255),
  country: z.string().trim().min(1).max(255),
})
export const updateAddressSchema = addressBodySchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required')
export const addressParamsSchema = z.object({ idaddress: uuidSchema })
