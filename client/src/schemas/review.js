import { z } from "zod";

import {
  dateTimeSchema,
  nullableUuidSchema,
  resourceSchemas,
  uuidSchema,
} from "@/schemas/common";

export const reviewStatusSchema = z.enum([
  "pending",
  "published",
  "rejected",
  "hidden",
]);

export const productReviewSchema = z.object({
  id: uuidSchema,
  userId: nullableUuidSchema,
  productId: uuidSchema,
  orderItemId: nullableUuidSchema,
  guestName: z.string().nullable(),
  title: z.string().nullable(),
  score: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  status: reviewStatusSchema,
  isVerifiedPurchase: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
export const productReviewInputSchema = z.object({
  userId: nullableUuidSchema.optional(),
  productId: uuidSchema,
  orderItemId: nullableUuidSchema.optional(),
  guestName: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  score: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  status: reviewStatusSchema.optional(),
  isVerifiedPurchase: z.boolean().optional(),
});

export const reviewSchemas = {
  "product-review": resourceSchemas(
    productReviewSchema,
    productReviewInputSchema,
  ),
};
