import { z } from "zod";

import {
  dateTimeSchema,
  decimalSchema,
  nullableUuidSchema,
  resourceSchemas,
  uuidSchema,
} from "@/schemas/common";

export const addressTypeSchema = z.enum(["home", "office", "other"]);
export const cartStatusSchema = z.enum(["active", "converted", "abandoned"]);

export const addressSchema = z.object({
  id: uuidSchema,
  userId: nullableUuidSchema,
  recipientName: z.string(),
  phone: z.string(),
  type: addressTypeSchema,
  addressLine: z.string(),
  ward: z.string().nullable(),
  district: z.string(),
  province: z.string(),
  country: z.string(),
  isDefault: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
export const addressInputSchema = z.object({
  userId: nullableUuidSchema.optional(),
  recipientName: z.string().trim().min(1),
  phone: z.string().trim().min(8).max(20),
  type: addressTypeSchema.optional(),
  addressLine: z.string().trim().min(1),
  ward: z.string().nullable().optional(),
  district: z.string().trim().min(1),
  province: z.string().trim().min(1),
  country: z.string().trim().min(1).optional(),
  isDefault: z.boolean().optional(),
});

export const cartSchema = z.object({
  id: uuidSchema,
  userId: nullableUuidSchema,
  guestToken: nullableUuidSchema,
  status: cartStatusSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
export const cartInputSchema = z.object({
  userId: nullableUuidSchema.optional(),
  guestToken: nullableUuidSchema.optional(),
  status: cartStatusSchema.optional(),
});

export const cartItemSchema = z.object({
  id: uuidSchema,
  cartId: uuidSchema,
  variantId: uuidSchema,
  quantity: z.number().int().positive(),
  unitPrice: decimalSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
export const cartItemInputSchema = z.object({
  cartId: uuidSchema,
  variantId: uuidSchema,
  quantity: z.number().int().positive().optional(),
  unitPrice: decimalSchema,
});

export const shoppingSchemas = {
  address: resourceSchemas(addressSchema, addressInputSchema),
  cart: resourceSchemas(cartSchema, cartInputSchema),
  "cart-item": resourceSchemas(cartItemSchema, cartItemInputSchema),
};
