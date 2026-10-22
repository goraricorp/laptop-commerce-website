import { and, asc, desc, eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "../database/index.js";
import {
  conversations,
  conversationParticipants,
  messages,
  messageAttachments,
  supportCommands,
  uploadAssets,
  user,
} from "../database/schema.js";
import { activeOwner, domainError as error } from "./account-state.js";
import { attachAssets } from "./storage.js";
const staff = (a) => ["moderator", "administrator", "master"].includes(a.role);
const messageInput = z
  .object({
    requestId: z.uuid(),
    content: z.string().trim().min(1).max(10000),
    attachments: z.array(z.url().max(4096)).max(4).default([]),
  })
  .strict();
async function ticket(tx, id, actor, lock = false) {
  let q = tx
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.type, "support")));
  if (lock) q = q.for("update");
  const [row] = await q;
  if (
    !row?.ownerId ||
    (row.ownerId !== actor.id &&
      (!staff(actor) || row.assignedToId !== actor.id))
  )
    throw error("Không tìm thấy phiếu hỗ trợ được phép truy cập.", 404);
  return row;
}
async function message(tx, row, actor, input) {
  for (const url of input.attachments) {
    const [asset] = await tx
      .select()
      .from(uploadAssets)
      .where(and(eq(uploadAssets.url, url), eq(uploadAssets.userId, actor.id)))
      .for("update");
    if (
      !asset ||
      asset.purpose !== "support" ||
      !/\.(png|jpe?g|webp)$/i.test(asset.key)
    )
      throw error("Ảnh đính kèm phải được tải lên bởi bạn.", 400);
  }
  await attachAssets(tx, input.attachments);
  const [entry] = await tx
    .insert(messages)
    .values({
      conversationId: row.id,
      senderUserId: actor.id,
      senderType: row.ownerId === actor.id ? "user" : "administrator",
      content: input.content,
    })
    .returning();
  for (const url of input.attachments) {
    const name = new URL(url).pathname.split("/").at(-1);
    await tx
      .insert(messageAttachments)
      .values({
        messageId: entry.id,
        url,
        fileName: name,
        mimeType: /\.webp$/i.test(name)
          ? "image/webp"
          : /\.png$/i.test(name)
            ? "image/png"
            : "image/jpeg",
      });
  }
  await tx
    .update(conversations)
    .set({
      status: row.ownerId === actor.id ? "open" : "pending",
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, row.id));
  return entry;
}
async function once(tx, actor, input, action) {
  const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const [claim] = await tx
    .insert(supportCommands)
    .values({ id: input.requestId, actorId: actor.id, hash })
    .onConflictDoNothing()
    .returning();
  if (!claim) {
    const [old] = await tx
      .select()
      .from(supportCommands)
      .where(eq(supportCommands.id, input.requestId));
    if (old.actorId !== actor.id || old.hash !== hash)
      throw error("Mã yêu cầu đã dùng với nội dung khác.");
    return old.result;
  }
  const result = await action();
  await tx
    .update(supportCommands)
    .set({ result })
    .where(eq(supportCommands.id, input.requestId));
  return result;
}
export async function createTicket(raw, actor) {
  const input = messageInput
    .extend({ subject: z.string().trim().min(3).max(255) })
    .parse(raw);
  return db.transaction(async (tx) => {
    await activeOwner(tx, actor.id);
    return once(tx, actor, input, async () => {
      const [row] = await tx
        .insert(conversations)
        .values({
          type: "support",
          ownerId: actor.id,
          subject: input.subject,
          status: "open",
        })
        .returning();
      await tx
        .insert(conversationParticipants)
        .values({
          conversationId: row.id,
          userId: actor.id,
          actorType: "user",
        });
      await message(tx, row, actor, input);
      return row;
    });
  });
}
export async function replyTicket(id, raw, actor) {
  const input = messageInput.parse(raw);
  return db.transaction(async (tx) => {
    actor = await activeOwner(tx, actor.id);
    const row = await ticket(tx, id, actor, true);
    return once(tx, actor, { ...input, ticketId: id }, async () => {
      const [owner] = await tx
        .select({ anonymizedAt: user.anonymizedAt })
        .from(user)
        .where(eq(user.id, row.ownerId));
      if (owner?.anonymizedAt)
        throw error("Tài khoản chủ phiếu đã được ẩn danh.");
      if (row.status === "closed")
        throw error("Phiếu đã đóng; mở lại trước khi trả lời.");
      return message(tx, row, actor, input);
    });
  });
}
export async function listTickets(raw, actor) {
  const { page, limit, queue } = z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      queue: z.enum(["mine", "unassigned", "all"]).default("mine"),
    })
    .strict()
    .parse(raw);
  if (!staff(actor) && queue !== "mine") throw error("Không có quyền.", 403);
  const where = and(
    eq(conversations.type, "support"),
    sql`${conversations.ownerId} is not null`,
    !staff(actor)
      ? eq(conversations.ownerId, actor.id)
      : queue === "mine"
        ? eq(conversations.assignedToId, actor.id)
        : queue === "unassigned"
          ? sql`${conversations.assignedToId} is null`
          : undefined,
  );
  const items = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      status: conversations.status,
      ownerId: conversations.ownerId,
      assignedToId: conversations.assignedToId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(where)
    .orderBy(desc(conversations.updatedAt), desc(conversations.id))
    .limit(limit)
    .offset((page - 1) * limit);
  const [{ total }] = await db
    .select({ total: sql`count(*)::int` })
    .from(conversations)
    .where(where);
  return {
    items: items.map((row) => ({
      ...row,
      subject:
        row.ownerId === actor.id || row.assignedToId === actor.id
          ? row.subject
          : "Phiếu chờ phân công",
    })),
    total,
    page,
    limit,
  };
}
export async function getTicket(id, actor) {
  return ticket(db, z.uuid().parse(id), actor);
}
export async function ticketMessages(id, raw, actor) {
  const { after, before } = z
    .object({ after: z.uuid().optional(), before: z.uuid().optional() })
    .strict()
    .parse(raw);
  await ticket(db, id, actor);
  if (after && before) throw error("Chỉ dùng một hướng phân trang.", 400);
  const [anchor] =
    after || before
      ? await db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.id, after ?? before),
              eq(messages.conversationId, id),
            ),
          )
      : [];
  if ((after || before) && !anchor)
    throw error("Cursor không thuộc phiếu.", 400);
  // UUID resolves a persisted timestamp with PostgreSQL precision, not a client-provided date.
  const where = and(
    eq(messages.conversationId, id),
    anchor
      ? sql`(created_at,id) ${sql.raw(before ? "<" : ">")} (select created_at,id from message where id=${anchor.id}::uuid)`
      : undefined,
  );
  let rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderUserId: messages.senderUserId,
      senderType: messages.senderType,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(where)
    .orderBy(
      before ? desc(messages.createdAt) : asc(messages.createdAt),
      before ? desc(messages.id) : asc(messages.id),
    )
    .limit(51);
  const hasMore = rows.length > 50;
  rows = rows.slice(0, 50);
  if (before) rows.reverse();
  const items = [];
  for (const row of rows)
    items.push({
      ...row,
      attachments: await db
        .select({
          url: messageAttachments.url,
          mimeType: messageAttachments.mimeType,
        })
        .from(messageAttachments)
        .where(eq(messageAttachments.messageId, row.id)),
    });
  return { items, hasMore, nextCursor: before ? rows[0]?.id : rows.at(-1)?.id };
}
export async function assignTicket(id, raw, actor) {
  if (!staff(actor)) throw error("Không có quyền.", 403);
  const { assigneeId } = z.object({ assigneeId: z.uuid() }).strict().parse(raw);
  return db.transaction(async (tx) => {
    actor = await activeOwner(tx, actor.id);
    if (!staff(actor)) throw error("Không có quyền.", 403);
    const [row] = await tx
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.type, "support")))
      .for("update");
    if (!row?.ownerId) throw error("Không tìm thấy phiếu.", 404);
    if (
      (assigneeId !== actor.id ||
        (row.assignedToId && row.assignedToId !== actor.id)) &&
      actor.role !== "master"
    )
      throw error("Chỉ master được giao lại phiếu cho người khác.", 403);
    const [assignee] = await tx
      .select()
      .from(user)
      .where(eq(user.id, assigneeId));
    if (
      !assignee ||
      assignee.banned ||
      assignee.anonymizedAt ||
      !staff(assignee)
    )
      throw error("Nhân viên không hợp lệ.", 400);
    const [result] = await tx
      .update(conversations)
      .set({ assignedToId: assigneeId, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    await tx
      .insert(conversationParticipants)
      .values({
        conversationId: id,
        userId: assigneeId,
        actorType: "administrator",
      });
    return result;
  });
}
export async function ticketStatus(id, raw, actor) {
  const { status } = z
    .object({ status: z.enum(["open", "closed"]) })
    .strict()
    .parse(raw);
  return db.transaction(async (tx) => {
    actor = await activeOwner(tx, actor.id);
    const row = await ticket(tx, id, actor, true);
    const [owner] = await tx
      .select({ anonymizedAt: user.anonymizedAt })
      .from(user)
      .where(eq(user.id, row.ownerId));
    if (status === "open" && owner?.anonymizedAt)
      throw error("Không mở lại phiếu của tài khoản đã ẩn danh.");
    return (
      await tx
        .update(conversations)
        .set({ status, updatedAt: new Date() })
        .where(eq(conversations.id, id))
        .returning()
    )[0];
  });
}
