import { sql } from 'drizzle-orm'
import { boolean, check, foreignKey, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { user } from './auth.js'
import { products } from './catalog.js'
import { orders } from './commerce.js'
import { createdAt, metadata, updatedAt } from './shared.js'

export const supportTeams = pgTable('support_team', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  channel: varchar('channel', { length: 32 }).default('sales').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const supportTeamMembers = pgTable('support_team_member', {
  teamId: uuid('team_id').notNull().references(() => supportTeams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 32 }).default('agent').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.teamId, table.userId] })])

export const knowledgeBases = pgTable('knowledge_base', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const knowledgeDocuments = pgTable('knowledge_document', {
  id: uuid('id').defaultRandom().primaryKey(),
  knowledgeBaseId: uuid('knowledge_base_id').notNull().references(() => knowledgeBases.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  sourceType: varchar('source_type', { length: 32 }).notNull(),
  sourceUrl: text('source_url'),
  checksum: varchar('checksum', { length: 128 }),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  version: integer('version').default(1).notNull(),
  metadata: metadata(),
  indexedAt: timestamp('indexed_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('knowledge_document_base_status_idx').on(table.knowledgeBaseId, table.status)])

export const knowledgeChunks = pgTable('knowledge_chunk', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => knowledgeDocuments.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  embeddingProvider: varchar('embedding_provider', { length: 64 }),
  embeddingModel: varchar('embedding_model', { length: 128 }),
  externalVectorId: varchar('external_vector_id', { length: 255 }),
  metadata: metadata(),
  createdAt: createdAt(),
}, (table) => [uniqueIndex('knowledge_chunk_document_position_idx').on(table.documentId, table.position)])

export const chatbotAgents = pgTable('chatbot_agent', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 128 }).notNull(),
  provider: varchar('provider', { length: 64 }).notNull(),
  model: varchar('model', { length: 128 }).notNull(),
  systemPrompt: text('system_prompt').notNull(),
  temperature: numeric('temperature', { precision: 4, scale: 3 }).default('0.2').notNull(),
  tools: jsonb('tools').default(sql`'[]'::jsonb`).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [check('chatbot_agent_temperature_check', sql`${table.temperature} between 0 and 2`)])

export const chatbotAgentKnowledgeBases = pgTable('chatbot_agent_knowledge_base', {
  agentId: uuid('agent_id').notNull().references(() => chatbotAgents.id, { onDelete: 'cascade' }),
  knowledgeBaseId: uuid('knowledge_base_id').notNull().references(() => knowledgeBases.id, { onDelete: 'cascade' }),
}, (table) => [primaryKey({ columns: [table.agentId, table.knowledgeBaseId] })])

export const conversations = pgTable('conversation', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 32 }).notNull(),
  channel: varchar('channel', { length: 32 }).default('web').notNull(),
  subject: varchar('subject', { length: 255 }),
  status: varchar('status', { length: 32 }).default('open').notNull(),
  priority: varchar('priority', { length: 16 }).default('normal').notNull(),
  teamId: uuid('team_id').references(() => supportTeams.id, { onDelete: 'set null' }),
  assignedTo: text('assigned_to').references(() => user.id, { onDelete: 'set null' }),
  chatbotAgentId: uuid('chatbot_agent_id').references(() => chatbotAgents.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  metadata: metadata(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('conversation_assignment_status_idx').on(table.assignedTo, table.status),
  index('conversation_last_message_idx').on(table.lastMessageAt),
])

export const conversationParticipants = pgTable('conversation_participant', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  participantType: varchar('participant_type', { length: 32 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  lastReadAt: timestamp('last_read_at', { withTimezone: true }),
}, (table) => [
  index('conversation_participant_conversation_idx').on(table.conversationId),
  index('conversation_participant_user_idx').on(table.userId),
])

export const conversationAssignments = pgTable('conversation_assignment', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').references(() => supportTeams.id, { onDelete: 'set null' }),
  agentId: text('agent_id').references(() => user.id, { onDelete: 'set null' }),
  assignedBy: text('assigned_by').references(() => user.id, { onDelete: 'set null' }),
  reason: text('reason'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
}, (table) => [index('conversation_assignment_conversation_date_idx').on(table.conversationId, table.assignedAt)])

export const messages = pgTable('message', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderParticipantId: uuid('sender_participant_id').references(() => conversationParticipants.id, { onDelete: 'set null' }),
  senderType: varchar('sender_type', { length: 32 }).notNull(),
  messageType: varchar('message_type', { length: 32 }).default('text').notNull(),
  content: text('content'),
  replyToId: uuid('reply_to_id'),
  status: varchar('status', { length: 32 }).default('sent').notNull(),
  moderationStatus: varchar('moderation_status', { length: 32 }).default('allowed').notNull(),
  metadata: metadata(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [
  foreignKey({ columns: [table.replyToId], foreignColumns: [table.id], name: 'message_reply_to_id_fk' }).onDelete('set null'),
  index('message_conversation_date_idx').on(table.conversationId, table.createdAt),
])

export const messageAttachments = pgTable('message_attachment', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(),
  url: text('url').notNull(),
  fileName: varchar('file_name', { length: 255 }),
  mimeType: varchar('mime_type', { length: 128 }),
  sizeBytes: integer('size_bytes'),
  metadata: metadata(),
}, (table) => [check('message_attachment_size_check', sql`${table.sizeBytes} is null or ${table.sizeBytes} >= 0`)])

export const messageReceipts = pgTable('message_receipt', {
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  participantId: uuid('participant_id').notNull().references(() => conversationParticipants.id, { onDelete: 'cascade' }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
}, (table) => [primaryKey({ columns: [table.messageId, table.participantId] })])

export const chatbotSessions = pgTable('chatbot_session', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => chatbotAgents.id, { onDelete: 'restrict' }),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 32 }).default('active').notNull(),
  context: jsonb('context').default(sql`'{}'::jsonb`).notNull(),
  summary: text('summary'),
  consentedAt: timestamp('consented_at', { withTimezone: true }),
  escalatedAt: timestamp('escalated_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('chatbot_session_conversation_idx').on(table.conversationId)])

export const chatbotRuns = pgTable('chatbot_run', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => chatbotSessions.id, { onDelete: 'cascade' }),
  requestMessageId: uuid('request_message_id').references(() => messages.id, { onDelete: 'set null' }),
  responseMessageId: uuid('response_message_id').references(() => messages.id, { onDelete: 'set null' }),
  providerRequestId: varchar('provider_request_id', { length: 255 }),
  model: varchar('model', { length: 128 }).notNull(),
  status: varchar('status', { length: 32 }).default('running').notNull(),
  promptTokens: integer('prompt_tokens').default(0).notNull(),
  completionTokens: integer('completion_tokens').default(0).notNull(),
  latencyMs: integer('latency_ms'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  index('chatbot_run_session_date_idx').on(table.sessionId, table.startedAt),
  check('chatbot_run_usage_check', sql`${table.promptTokens} >= 0 and ${table.completionTokens} >= 0 and (${table.latencyMs} is null or ${table.latencyMs} >= 0)`),
])

export const chatbotToolCalls = pgTable('chatbot_tool_call', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull().references(() => chatbotRuns.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 128 }).notNull(),
  arguments: jsonb('arguments').default(sql`'{}'::jsonb`).notNull(),
  result: jsonb('result'),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export const chatbotRunSources = pgTable('chatbot_run_source', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull().references(() => chatbotRuns.id, { onDelete: 'cascade' }),
  chunkId: uuid('chunk_id').references(() => knowledgeChunks.id, { onDelete: 'set null' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }),
  url: text('url'),
  relevanceScore: numeric('relevance_score', { precision: 8, scale: 6 }),
}, (table) => [
  index('chatbot_run_source_run_idx').on(table.runId),
  check('chatbot_run_source_target_check', sql`${table.chunkId} is not null or ${table.productId} is not null or ${table.url} is not null`),
])

export const chatbotFeedback = pgTable('chatbot_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull().references(() => chatbotRuns.id, { onDelete: 'cascade' }),
  accountId: text('account_id').references(() => user.id, { onDelete: 'set null' }),
  rating: integer('rating'),
  reason: varchar('reason', { length: 128 }),
  comment: text('comment'),
  createdAt: createdAt(),
}, (table) => [
  index('chatbot_feedback_run_idx').on(table.runId),
  check('chatbot_feedback_rating_check', sql`${table.rating} is null or ${table.rating} between 1 and 5`),
])

export const chatSchema = {
  chatbotAgentKnowledgeBases,
  chatbotAgents,
  chatbotFeedback,
  chatbotRunSources,
  chatbotRuns,
  chatbotSessions,
  chatbotToolCalls,
  conversationAssignments,
  conversationParticipants,
  conversations,
  knowledgeBases,
  knowledgeChunks,
  knowledgeDocuments,
  messageAttachments,
  messageReceipts,
  messages,
  supportTeamMembers,
  supportTeams,
}
