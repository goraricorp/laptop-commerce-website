import { z } from "zod";

import {
  dateTimeSchema,
  nullableUuidSchema,
  resourceSchemas,
  uuidSchema,
} from "@/schemas/common";

export const conversationTypeSchema = z.enum([
  "buyer-seller",
  "buyer-chatbot",
  "support",
]);
export const conversationStatusSchema = z.enum([
  "open",
  "pending",
  "resolved",
  "closed",
]);
export const actorTypeSchema = z.enum([
  "user",
  "guest",
  "moderator",
  "administrator",
  "chatbot",
  "system",
]);
export const senderTypeSchema = z.enum([
  "user",
  "guest",
  "moderator",
  "administrator",
  "chatbot",
  "system",
]);

export const conversationSchema = z.object({
  id: uuidSchema,
  type: conversationTypeSchema,
  status: conversationStatusSchema,
  subject: z.string().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});
export const conversationInputSchema = z.object({
  type: conversationTypeSchema.optional(),
  status: conversationStatusSchema.optional(),
  subject: z.string().nullable().optional(),
});

export const conversationParticipantSchema = z.object({
  id: uuidSchema,
  conversationId: uuidSchema,
  userId: nullableUuidSchema,
  actorType: actorTypeSchema,
  displayName: z.string().nullable(),
  joinedAt: dateTimeSchema,
});
export const conversationParticipantInputSchema = z.object({
  conversationId: uuidSchema,
  userId: nullableUuidSchema.optional(),
  actorType: actorTypeSchema.optional(),
  displayName: z.string().nullable().optional(),
  joinedAt: dateTimeSchema.optional(),
});

export const messageSchema = z.object({
  id: uuidSchema,
  conversationId: uuidSchema,
  senderUserId: nullableUuidSchema,
  senderType: senderTypeSchema,
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: dateTimeSchema,
});
export const messageInputSchema = z.object({
  conversationId: uuidSchema,
  senderUserId: nullableUuidSchema.optional(),
  senderType: senderTypeSchema.optional(),
  content: z.string().trim().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const messageAttachmentSchema = z.object({
  id: uuidSchema,
  messageId: uuidSchema,
  url: z.string(),
  mimeType: z.string(),
  fileName: z.string().nullable(),
  sizeBytes: z.number().int().nullable(),
});
export const messageAttachmentInputSchema = z.object({
  messageId: uuidSchema,
  url: z.url(),
  mimeType: z.string().trim().min(1),
  fileName: z.string().nullable().optional(),
  sizeBytes: z.number().int().nonnegative().nullable().optional(),
});

export const chatSchemas = {
  conversation: resourceSchemas(conversationSchema, conversationInputSchema),
  "conversation-participant": resourceSchemas(
    conversationParticipantSchema,
    conversationParticipantInputSchema,
  ),
  message: resourceSchemas(messageSchema, messageInputSchema),
  "message-attachment": resourceSchemas(
    messageAttachmentSchema,
    messageAttachmentInputSchema,
  ),
};
