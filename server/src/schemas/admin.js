import { z } from 'zod'

import { uuidSchema } from './common.js'

export const adminIdParamsSchema = z.object({ id: uuidSchema })
export const adminUserBodySchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  email: z.email().optional(),
  image: z.string().trim().max(2048).nullable().optional(),
  role: z.enum(['customer', 'admin']).optional(),
  firstName: z.string().trim().max(255).nullable().optional(),
  lastName: z.string().trim().max(255).nullable().optional(),
  phone: z.string().trim().max(15).nullable().optional(),
  birthday: z.iso.date().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required')

export const configurationBodySchema = z.object({
  productId: uuidSchema,
  cpu: z.string().trim().max(255).nullable().optional(),
  ram: z.coerce.number().int().positive().nullable().optional(),
  gpu: z.string().trim().max(255).nullable().optional(),
  storage: z.coerce.number().int().positive().nullable().optional(),
  screen: z.coerce.number().int().positive(),
  resolution: z.string().trim().min(1).max(32),
  price: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().nonnegative().default(0),
})
export const colorBodySchema = z.object({ productId: uuidSchema, value: z.string().trim().min(1).max(255) })
export const descriptionBodySchema = z.object({
  productId: uuidSchema,
  title: z.string().trim().max(255).nullable().optional(),
  content: z.string().trim().max(4096).nullable().optional(),
  image: z.string().trim().max(2048).nullable().optional(),
})
export const voucherBodySchema = z.object({
  name: z.string().trim().min(1).max(32),
  percentage: z.coerce.number().int().min(0).max(100).default(0),
  value: z.coerce.number().nonnegative().default(0),
  startDate: z.iso.date().nullable().optional(),
  endDate: z.iso.date(),
  status: z.coerce.number().int().min(0).max(1).default(0),
})

export const adminResourceSchemas = {
  color: colorBodySchema,
  configuration: configurationBodySchema,
  description: descriptionBodySchema,
  voucher: voucherBodySchema,
}
