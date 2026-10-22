import { z } from "zod";

import {
  dateTimeSchema,
  nullableUuidSchema,
  resourceSchemas,
  uuidSchema,
} from "@/schemas/common";

export const inventoryLocationTypeSchema = z.enum([
  "store",
  "warehouse",
  "service_center",
]);
export const stockMovementTypeSchema = z.enum([
  "receipt",
  "issue",
  "transfer_in",
  "transfer_out",
  "adjustment",
  "reservation",
  "release",
  "return",
]);

export const inventoryLocationSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  type: inventoryLocationTypeSchema,
  address: z.string().nullable(),
  phone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
export const inventoryLocationInputSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: inventoryLocationTypeSchema.optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const inventoryBalanceSchema = z.object({
  locationId: uuidSchema,
  variantId: uuidSchema,
  quantityOnHand: z.number().int().nonnegative(),
  quantityReserved: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
  updatedAt: dateTimeSchema,
});
const inventoryBalanceInputObject = z.object({
  locationId: uuidSchema,
  variantId: uuidSchema,
  quantityOnHand: z.number().int().nonnegative().optional(),
  quantityReserved: z.number().int().nonnegative().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
});
const validInventoryBalance = (value) =>
  (value.quantityReserved ?? 0) <=
  (value.quantityOnHand ?? Number.MAX_SAFE_INTEGER);
export const inventoryBalanceInputSchema = inventoryBalanceInputObject.refine(
  validInventoryBalance,
  {
    message: "Reserved quantity cannot exceed on-hand quantity",
    path: ["quantityReserved"],
  },
);
export const inventoryBalanceUpdateSchema = inventoryBalanceInputObject
  .partial()
  .refine(validInventoryBalance, {
    message: "Reserved quantity cannot exceed on-hand quantity",
    path: ["quantityReserved"],
  });

export const stockMovementSchema = z.object({
  id: uuidSchema,
  locationId: uuidSchema,
  variantId: uuidSchema,
  type: stockMovementTypeSchema,
  quantity: z.number().int(),
  referenceType: z.string().nullable(),
  referenceId: nullableUuidSchema,
  note: z.string().nullable(),
  createdAt: dateTimeSchema,
});
export const stockMovementInputSchema = z.object({
  locationId: uuidSchema,
  variantId: uuidSchema,
  type: z.enum(["receipt", "issue", "adjustment", "return"]).optional(),
  quantity: z
    .number()
    .int()
    .refine((value) => value !== 0, "Quantity cannot be zero"),
  referenceType: z.string().nullable().optional(),
  referenceId: nullableUuidSchema.optional(),
  note: z.string().trim().min(1).max(2000),
});

export const inventorySchemas = {
  "inventory-location": resourceSchemas(
    inventoryLocationSchema,
    inventoryLocationInputSchema,
  ),
  "inventory-balance": resourceSchemas(
    inventoryBalanceSchema,
    inventoryBalanceInputSchema,
    inventoryBalanceUpdateSchema,
  ),
  "stock-movement": resourceSchemas(
    stockMovementSchema,
    stockMovementInputSchema,
  ),
};
