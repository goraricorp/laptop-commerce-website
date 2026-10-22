import { mutateWithAssets } from "./storage.js";

import { eq } from "drizzle-orm";
import { db } from "../database/index.js";
import {
  conversationParticipants,
  conversations,
  messageAttachments,
  messages,
} from "../database/schema.js";
export async function getConversations() {
  return await db.select().from(conversations);
}
export async function getConversation(id) {
  return (
    (
      await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createConversation(data) {
  return (await db.insert(conversations).values(data).returning())[0];
}
export async function updateConversation(id, data) {
  return (
    (
      await db
        .update(conversations)
        .set(data)
        .where(eq(conversations.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteConversation(id) {
  return (
    (
      await db.delete(conversations).where(eq(conversations.id, id)).returning()
    )[0] ?? null
  );
}
export async function getConversationParticipants() {
  return await db.select().from(conversationParticipants);
}
export async function getConversationParticipant(id) {
  return (
    (
      await db
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createConversationParticipant(data) {
  return (
    await db.insert(conversationParticipants).values(data).returning()
  )[0];
}
export async function updateConversationParticipant(id, data) {
  return (
    (
      await db
        .update(conversationParticipants)
        .set(data)
        .where(eq(conversationParticipants.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteConversationParticipant(id) {
  return (
    (
      await db
        .delete(conversationParticipants)
        .where(eq(conversationParticipants.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function getMessages() {
  return await db.select().from(messages);
}
export async function getMessage(id) {
  return (
    (await db.select().from(messages).where(eq(messages.id, id)).limit(1))[0] ??
    null
  );
}
export async function createMessage(data) {
  return (await db.insert(messages).values(data).returning())[0];
}
export async function updateMessage(id, data) {
  return (
    (
      await db.update(messages).set(data).where(eq(messages.id, id)).returning()
    )[0] ?? null
  );
}
export async function deleteMessage(id) {
  return (
    (await db.delete(messages).where(eq(messages.id, id)).returning())[0] ??
    null
  );
}
export async function getMessageAttachments() {
  return await db.select().from(messageAttachments);
}
export async function getMessageAttachment(id) {
  return (
    (
      await db
        .select()
        .from(messageAttachments)
        .where(eq(messageAttachments.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createMessageAttachment(data) {
  return mutateWithAssets(messageAttachments, "create", null, data);
}
export async function updateMessageAttachment(id, data) {
  return mutateWithAssets(messageAttachments, "update", id, data);
}
export async function deleteMessageAttachment(id) {
  return mutateWithAssets(messageAttachments, "delete", id);
}
