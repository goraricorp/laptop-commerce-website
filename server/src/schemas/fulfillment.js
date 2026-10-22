import { z } from "zod";
const reason = z.string().trim().min(3).max(1000);
const base = { commandId: z.uuid(), note: reason };
const inspection = z
  .object({
    itemId: z.uuid(),
    acceptedQuantity: z.number().int().min(0).max(10000),
    restockQuantity: z.number().int().min(0).max(10000),
    locationId: z.uuid().optional(),
    condition: z.enum(["resellable", "damaged", "incomplete", "other"]),
    note: reason,
  })
  .strict();
export const shipmentInput = z
  .object({
    ...base,
    action: z.enum(["prepare", "handover", "delivered", "failed", "retry"]),
    carrier: z.string().trim().min(1).max(100).optional(),
    trackingNumber: z.string().trim().min(1).max(255).optional(),
    codProof: z.string().trim().min(3).max(1000).optional(),
  })
  .strict();
export const returnInput = z
  .object({
    ...base,
    items: z
      .array(
        z
          .object({
            orderItemId: z.uuid(),
            quantity: z.number().int().min(1).max(10000),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();
export const returnCommandInput = z
  .object({
    ...base,
    action: z.enum(["approve", "reject", "receive", "inspect", "complete"]),
    items: z.array(inspection).min(1).max(100).optional(),
  })
  .strict();
export const refundInput = z
  .object({
    ...base,
    purpose: z.enum(["return", "paid_cancellation", "shipping"]),
    returnId: z.uuid().optional(),
    shippingAmount: z.number().int().min(0).default(0),
    shippingReason: reason.optional(),
  })
  .strict();
export const manualRefundInput = z.object({ ...base, proof: reason }).strict();
export const retryInput = z
  .object({
    ...base,
    providerRefundId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,100}$/)
      .optional(),
  })
  .strict();
