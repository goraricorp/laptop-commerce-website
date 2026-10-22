import { and, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/index.js";
import {
  account,
  accountAudits,
  addresses,
  cartItems,
  carts,
  conversationParticipants,
  conversations,
  favorites,
  messageAttachments,
  messages,
  newsletterSubscriptions,
  notificationPreferences,
  productReviews,
  session,
  supportCommands,
  twoFactor,
  user,
  verification,
} from "../database/schema.js";
import { assertAssured } from "../lib/auth/assurance.js";
import { activeOwner, domainError as error } from "./account-state.js";
import { queueAssetCleanup } from "./storage.js";
export async function transferMaster(current, raw) {
  assertAssured(current, { fresh: true });
  const { successorId } = z
    .object({ successorId: z.uuid() })
    .strict()
    .parse(raw);
  if (successorId === current.user.id)
    throw error("Chọn một người nhận khác.", 400);
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended('master-handoff',0))`,
    );
    const owner = await activeOwner(tx, current.user.id);
    if (owner.role !== "master") throw error("Chỉ master được bàn giao.", 403);
    const successor = await activeOwner(tx, successorId);
    if (
      !successor.emailVerified ||
      !["administrator", "master"].includes(successor.role)
    )
      throw error("Người nhận cần là quản trị viên đã xác minh email.", 400);
    await tx
      .update(user)
      .set({ role: "master", updatedAt: new Date() })
      .where(eq(user.id, successorId));
    await tx
      .update(user)
      .set({ role: "administrator", updatedAt: new Date() })
      .where(eq(user.id, owner.id));
    await tx
      .delete(session)
      .where(
        or(
          eq(session.userId, successorId),
          and(
            eq(session.userId, owner.id),
            sql`${session.id}<>${current.session.id}::uuid`,
          ),
        ),
      );
    await tx
      .insert(accountAudits)
      .values({
        actorId: owner.id,
        subjectId: successorId,
        action: "master.transferred",
        details: { previousMasterId: owner.id },
      });
    return { transferred: true };
  });
}
export async function anonymizeAccount(current, raw) {
  assertAssured(current, { fresh: true });
  const { confirmEmail } = z
    .object({ confirmEmail: z.email() })
    .strict()
    .parse(raw);
  const urls = [];
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended('master-handoff',0))`,
    );
    const owner = await activeOwner(tx, current.user.id);
    if (owner.email.toLowerCase() !== confirmEmail.toLowerCase())
      throw error("Email xác nhận không khớp tài khoản.", 400);
    if (owner.role === "master")
      throw error("Bàn giao master trước khi xóa tài khoản.");
    const open = await tx.execute(
      sql`select exists(select 1 from sales_order where user_id=${owner.id}::uuid and order_status in ('pending','confirmed','processing')) or exists(select 1 from sales_return where user_id=${owner.id}::uuid and status not in ('rejected','completed')) or exists(select 1 from refund r join sales_order o on o.id=r.order_id where o.user_id=${owner.id}::uuid and r.state in ('pending','processing','needs_review')) or exists(select 1 from checkout_session cs where cs.user_id=${owner.id}::uuid and cs.state='paid_late' and not exists(select 1 from refund r where r.order_id=cs.order_id and r.purpose='paid_cancellation' and r.state='succeeded')) as blocked`,
    );
    if (open.rows[0].blocked)
      throw error(
        "Còn đơn hàng, trả hàng hoặc hoàn tiền đang xử lý; hoàn tất nghiệp vụ trước khi xóa.",
      );
    await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.ownerId, owner.id))
      .orderBy(conversations.id)
      .for("update");
    if (owner.image) urls.push(owner.image);
    const authored = await tx
      .select({ id: messages.id })
      .from(messages)
      .where(
        or(
          eq(messages.senderUserId, owner.id),
          sql`${messages.conversationId} in (select id from conversation where owner_id=${owner.id}::uuid)`,
        ),
      );
    if (authored.length) {
      const ids = authored.map((m) => m.id),
        attachments = await tx
          .select()
          .from(messageAttachments)
          .where(inArray(messageAttachments.messageId, ids));
      urls.push(...attachments.map((a) => a.url));
      await tx
        .delete(messageAttachments)
        .where(inArray(messageAttachments.messageId, ids));
      await tx
        .update(messages)
        .set({
          content: "Nội dung đã ẩn theo yêu cầu xóa tài khoản.",
          metadata: { anonymized: true },
        })
        .where(inArray(messages.id, ids));
    }
    await tx
      .update(supportCommands)
      .set({ result: { anonymized: true } })
      .where(
        or(
          eq(supportCommands.actorId, owner.id),
          sql`${supportCommands.result}->>'conversationId' in (select id::text from conversation where owner_id=${owner.id}::uuid)`,
          sql`${supportCommands.result}->>'id' in (select id::text from conversation where owner_id=${owner.id}::uuid)`,
        ),
      );
    await tx
      .update(conversations)
      .set({
        subject: "Phiếu của tài khoản đã xóa",
        status: "closed",
        updatedAt: new Date(),
      })
      .where(eq(conversations.ownerId, owner.id));
    await tx
      .update(conversations)
      .set({ assignedToId: null, updatedAt: new Date() })
      .where(eq(conversations.assignedToId, owner.id));
    await tx
      .update(conversationParticipants)
      .set({ displayName: null })
      .where(eq(conversationParticipants.userId, owner.id));
    await tx
      .update(productReviews)
      .set({
        comment: null,
        title: null,
        guestName: null,
        status: "hidden",
        updatedAt: new Date(),
      })
      .where(eq(productReviews.userId, owner.id));
    const ownCarts = await tx
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, owner.id));
    if (ownCarts.length)
      await tx.delete(cartItems).where(
        inArray(
          cartItems.cartId,
          ownCarts.map((c) => c.id),
        ),
      );
    await tx.delete(carts).where(eq(carts.userId, owner.id));
    for (const table of [
      addresses,
      favorites,
      notificationPreferences,
      account,
      twoFactor,
      session,
    ])
      await tx.delete(table).where(eq(table.userId, owner.id));
    await tx
      .delete(verification)
      .where(
        or(
          eq(verification.value, owner.id),
          eq(verification.identifier, owner.email),
          sql`${verification.identifier} like ${"%" + owner.email.replaceAll("%", "\\%").replaceAll("_", "\\_") + "%"}`,
        ),
      );
    await tx
      .delete(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, owner.email.toLowerCase()));
    await tx
      .update(user)
      .set({
        name: "Tài khoản đã xóa",
        email: `${owner.id}@deleted.invalid`,
        emailVerified: false,
        image: null,
        username: null,
        displayUsername: null,
        firstName: null,
        lastName: null,
        phone: null,
        birthday: null,
        role: "user",
        banned: true,
        banReason: "account_anonymized",
        banExpires: null,
        twoFactorEnabled: false,
        anonymizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, owner.id));
    await tx
      .insert(accountAudits)
      .values({
        actorId: owner.id,
        subjectId: owner.id,
        action: "account.anonymized",
        details: { transactionDocumentsRetained: true },
      });
  });
  await queueAssetCleanup(urls).catch(() => {});
  return {
    anonymized: true,
    message:
      "Đã xóa dữ liệu tài khoản và thu hồi phiên. Chứng từ giao dịch được giữ lại.",
  };
}
