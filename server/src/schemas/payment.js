import { z } from 'zod'

export const createPaymentSchema = z.object({
  totalPrice: z.coerce.number().positive().max(1_000_000),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default('USD'),
})
export const capturePaymentSchema = z.object({
  orderID: z.string().trim().min(1).max(64),
})
