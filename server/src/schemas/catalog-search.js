import { z } from 'zod'
const jsonAttributes = z
  .string()
  .max(10000)
  .transform((value, ctx) => {
    try {
      return JSON.parse(value)
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Thuộc tính không hợp lệ.' })
      return z.NEVER
    }
  })
  .pipe(
    z
      .record(z.string().min(1).max(100), z.array(z.uuid()).min(1).max(50))
      .refine((value) => Object.keys(value).length <= 20),
  )
export const searchInput = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(24),
    q: z.string().trim().max(255).optional(),
    type: z.string().max(100).optional(),
    categoryId: z.uuid().optional(),
    brandId: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.array(z.uuid()).max(50))
      .optional(),
    brand: z.string().max(255).optional(),
    minPrice: z.coerce.number().min(0).max(999999999999.99).optional(),
    maxPrice: z.coerce.number().min(0).max(999999999999.99).optional(),
    sort: z
      .enum(['newest', 'name', 'price-asc', 'price-desc'])
      .default('newest'),
    attributes: jsonAttributes.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    { path: ['maxPrice'], message: 'Khoảng giá không hợp lệ.' },
  )
