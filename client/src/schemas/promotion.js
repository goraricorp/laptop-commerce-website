import { z } from "zod";

import {
  dateTimeSchema,
  decimalSchema,
  nullableUuidSchema,
  resourceSchemas,
  uuidSchema,
} from "@/schemas/common";

export const discountTypeSchema = z.enum(["percentage", "fixed"]);

export const promotionSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  discountType: discountTypeSchema,
  discountValue: decimalSchema,
  minimumOrderValue: decimalSchema,
  maximumDiscount: decimalSchema.nullable(),
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  isActive: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
const promotionInputObject = z.object({
  name: z.string().trim().min(1),
  discountType: discountTypeSchema.optional(),
  discountValue: decimalSchema,
  minimumOrderValue: decimalSchema.optional(),
  maximumDiscount: decimalSchema.nullable().optional(),
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  isActive: z.boolean().optional(),
});
const validPromotionPeriod = (value) =>
  !value.startsAt ||
  !value.endsAt ||
  new Date(value.endsAt) > new Date(value.startsAt);
export const promotionInputSchema = promotionInputObject.refine(
  validPromotionPeriod,
  {
    message: "End time must be after start time",
    path: ["endsAt"],
  },
);
export const promotionUpdateSchema = promotionInputObject
  .partial()
  .refine(validPromotionPeriod, {
    message: "End time must be after start time",
    path: ["endsAt"],
  });

export const promotionCodeSchema = z.object({
  id: uuidSchema,
  promotionId: uuidSchema,
  code: z.string(),
  usageLimit: z.number().int().nullable(),
  usagePerUser: z.number().int().positive(),
  usedCount: z.number().int().nonnegative(),
});
export const promotionCodeInputSchema = z.object({
  promotionId: uuidSchema,
  code: z.string().trim().min(1),
  usageLimit: z.number().int().positive().nullable().optional(),
  usagePerUser: z.number().int().positive().optional(),
  usedCount: z.number().int().nonnegative().optional(),
});

export const promotionUsageSchema = z.object({
  id: uuidSchema,
  promotionCodeId: uuidSchema,
  userId: nullableUuidSchema,
  orderId: uuidSchema,
  usedAt: dateTimeSchema,
});
export const promotionUsageInputSchema = z.object({
  promotionCodeId: uuidSchema,
  userId: nullableUuidSchema.optional(),
  orderId: uuidSchema,
  usedAt: dateTimeSchema.optional(),
});

export const promotionSchemas = {
  promotion: resourceSchemas(
    promotionSchema,
    promotionInputSchema,
    promotionUpdateSchema,
  ),
  "promotion-code": resourceSchemas(
    promotionCodeSchema,
    promotionCodeInputSchema,
  ),
  "promotion-usage": resourceSchemas(
    promotionUsageSchema,
    promotionUsageInputSchema,
  ),
};
