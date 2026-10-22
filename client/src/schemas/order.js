import { z } from "zod";

import {
  dateTimeSchema,
  decimalSchema,
  nullableUuidSchema,
  resourceSchemas,
  uuidSchema,
} from "@/schemas/common";

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
  "returned",
]);
export const orderStatusChangeSchema = z.object({
  status: orderStatusSchema,
  note: z.string().max(500, "Ghi chú tối đa 500 ký tự").nullable().optional(),
});
export const paymentStatusSchema = z.enum([
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
]);
export const fulfillmentStatusSchema = z.enum([
  "unfulfilled",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
]);
export const orderAddressTypeSchema = z.enum(["shipping", "billing"]);
export const paymentProviderSchema = z.enum([
  "momo",
  "vnpay",
  "paypal",
  "cod",
  "bank_transfer",
  "other",
]);
export const paymentMethodSchema = z.enum([
  "online",
  "cod",
  "card",
  "bank_transfer",
  "wallet",
]);
export const paymentRecordStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "refunded",
]);
export const shipmentStatusSchema = z.enum([
  "pending",
  "processing",
  "shipped",
  "in_transit",
  "delivered",
  "failed",
  "returned",
]);

export const salesOrderSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  userId: nullableUuidSchema,
  guestEmail: z.string().nullable(),
  subtotal: decimalSchema,
  discountTotal: decimalSchema,
  shippingTotal: decimalSchema,
  grandTotal: decimalSchema,
  orderStatus: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  fulfillmentStatus: fulfillmentStatusSchema,
  note: z.string().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
export const salesOrderInputSchema = z.object({
  code: z.string().trim().min(1),
  userId: nullableUuidSchema.optional(),
  guestEmail: z.email().nullable().optional(),
  subtotal: decimalSchema,
  discountTotal: decimalSchema.optional(),
  shippingTotal: decimalSchema.optional(),
  grandTotal: decimalSchema,
  orderStatus: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  fulfillmentStatus: fulfillmentStatusSchema.optional(),
  note: z.string().nullable().optional(),
});

export const salesOrderItemSchema = z.object({
  id: uuidSchema,
  orderId: uuidSchema,
  variantId: nullableUuidSchema,
  sku: z.string(),
  productName: z.string(),
  variantName: z.string(),
  unitPrice: decimalSchema,
  quantity: z.number().int().positive(),
  total: decimalSchema,
});
export const salesOrderItemInputSchema = z.object({
  orderId: uuidSchema,
  variantId: nullableUuidSchema.optional(),
  sku: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  variantName: z.string().trim().min(1),
  unitPrice: decimalSchema,
  quantity: z.number().int().positive(),
  total: decimalSchema,
});

export const orderAddressSchema = z.object({
  id: uuidSchema,
  orderId: uuidSchema,
  type: orderAddressTypeSchema,
  recipientName: z.string(),
  phone: z.string(),
  addressLine: z.string(),
  ward: z.string().nullable(),
  district: z.string(),
  province: z.string(),
  country: z.string(),
});
export const orderAddressInputSchema = z.object({
  orderId: uuidSchema,
  type: orderAddressTypeSchema.optional(),
  recipientName: z.string().trim().min(1),
  phone: z.string().trim().min(8).max(20),
  addressLine: z.string().trim().min(1),
  ward: z.string().nullable().optional(),
  district: z.string().trim().min(1),
  province: z.string().trim().min(1),
  country: z.string().trim().min(1).optional(),
});

export const paymentSchema = z.object({
  id: uuidSchema,
  orderId: uuidSchema,
  provider: paymentProviderSchema,
  method: paymentMethodSchema,
  transactionId: z.string().nullable(),
  amount: decimalSchema,
  status: paymentRecordStatusSchema,
  paidAt: dateTimeSchema.nullable(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
export const paymentInputSchema = z.object({
  orderId: uuidSchema,
  provider: paymentProviderSchema.optional(),
  method: paymentMethodSchema.optional(),
  transactionId: z.string().nullable().optional(),
  amount: decimalSchema,
  status: paymentRecordStatusSchema.optional(),
  paidAt: dateTimeSchema.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const shipmentSchema = z.object({
  id: uuidSchema,
  orderId: uuidSchema,
  carrier: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  status: shipmentStatusSchema,
  shippedAt: dateTimeSchema.nullable(),
  deliveredAt: dateTimeSchema.nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
export const shipmentInputSchema = z.object({
  orderId: uuidSchema,
  carrier: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  status: shipmentStatusSchema.optional(),
  shippedAt: dateTimeSchema.nullable().optional(),
  deliveredAt: dateTimeSchema.nullable().optional(),
});

export const orderStatusHistorySchema = z.object({
  id: uuidSchema,
  orderId: uuidSchema,
  status: orderStatusSchema,
  note: z.string().nullable(),
  createdAt: dateTimeSchema,
});
export const orderStatusHistoryInputSchema = z.object({
  orderId: uuidSchema,
  status: orderStatusSchema.optional(),
  note: z.string().nullable().optional(),
});

export const orderSchemas = {
  "sales-order": resourceSchemas(salesOrderSchema, salesOrderInputSchema),
  "sales-order-item": resourceSchemas(
    salesOrderItemSchema,
    salesOrderItemInputSchema,
  ),
  "order-address": resourceSchemas(orderAddressSchema, orderAddressInputSchema),
  payment: resourceSchemas(paymentSchema, paymentInputSchema),
  shipment: resourceSchemas(shipmentSchema, shipmentInputSchema),
  "order-status-history": resourceSchemas(
    orderStatusHistorySchema,
    orderStatusHistoryInputSchema,
  ),
};
