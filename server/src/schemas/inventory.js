import { z } from 'zod'
export const locationInput = z
  .object({
    code: z.string().trim().min(1).max(50),
    name: z.string().trim().min(1).max(255),
    type: z.enum(['store', 'warehouse', 'service_center']).optional(),
    address: z.string().max(2000).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
const quantity = z
  .number()
  .int()
  .min(-2147483647)
  .max(2147483647)
  .refine((value) => value !== 0, 'Số lượng phải khác 0.')
export const movementInput = z
  .object({
    operationId: z.uuid(),
    locationId: z.uuid(),
    variantId: z.uuid(),
    type: z
      .enum(['receipt', 'issue', 'adjustment', 'return'])
      .default('adjustment'),
    quantity,
    referenceType: z.string().trim().max(50).nullable().optional(),
    referenceId: z.uuid().nullable().optional(),
    note: z.string().trim().min(1).max(2000),
  })
  .strict()
  .refine((value) => value.type === 'adjustment' || value.quantity > 0, {
    path: ['quantity'],
    message: 'Nhập số lượng dương; loại giao dịch quyết định chiều biến động.',
  })
export const transferInput = z
  .object({
    operationId: z.uuid(),
    sourceLocationId: z.uuid(),
    targetLocationId: z.uuid(),
    variantId: z.uuid(),
    quantity: z.number().int().min(1).max(2147483647),
    note: z.string().trim().min(1).max(2000),
  })
  .strict()
  .refine((value) => value.sourceLocationId !== value.targetLocationId, {
    path: ['targetLocationId'],
    message: 'Kho đích phải khác kho nguồn.',
  })
export const reorderInput = z
  .object({ reorderLevel: z.number().int().nonnegative().max(2147483647) })
  .strict()

export const reconcileAdjustmentInput = z
  .object({
    operationId: z.uuid(),
    locationId: z.uuid(),
    variantId: z.uuid(),
    expectedActualOnHand: z.number().int().nonnegative().max(2147483647),
    quantityOnHand: z.number().int().nonnegative().max(2147483647),
    expectedActualReserved: z
      .number()
      .int()
      .nonnegative()
      .max(2147483647)
      .optional(),
    quantityReserved: z.number().int().nonnegative().max(2147483647).optional(),
    note: z.string().trim().min(1).max(2000),
  })
  .strict()
  .refine(
    (value) =>
      (value.expectedActualReserved === undefined) ===
      (value.quantityReserved === undefined),
    {
      path: ['quantityReserved'],
      message: 'Sửa reserved cần cả giá trị đã đối soát và giá trị đích.',
    },
  )
