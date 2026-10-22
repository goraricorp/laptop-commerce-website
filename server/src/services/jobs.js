import {cleanupHttpSessions} from '../middlewares/session.js';
import {dispatchNewsletter,transactionalEmailAllowed} from './account-features.js';
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../database/index.js";
import {
  jobLeases,
  orders,
  outbox,
  payments,
  refunds,
  user,
  webhookInbox,
} from "../database/schema.js";
import { inventoryTransaction } from "./stock-ledger.js";
import { applyRefundResult, lockOrder } from "./fulfillment.js";
import { executeRefund } from "./refund-gateways.js";
import {
  handleGatewayNotification,
  reconcileExpiredCheckouts,
} from "./checkout.js";
import { cleanupAssets } from "./storage.js";
import { sendOrderEventEmail } from "../lib/email/mailer.js";

export async function receiveWebhook(
  provider,
  eventId,
  reference,
  kind = "payment",
  merchantReference = null,
) {
  // Called ONLY after raw signature verification. Store references, never raw sensitive payloads.
  return db.transaction(async (tx) => {
    const [event] = await tx
      .insert(webhookInbox)
      .values({ provider, eventId, reference, kind })
      .onConflictDoNothing()
      .returning();
    if (!event) {
      const [old] = await tx
        .select()
        .from(webhookInbox)
        .where(
          and(
            eq(webhookInbox.provider, provider),
            eq(webhookInbox.eventId, eventId),
          ),
        );
      if (old.reference !== reference || old.kind !== kind)
        throw Object.assign(
          new Error("Webhook event ID có nội dung xung đột."),
          { status: 409 },
        );
      return { duplicate: true };
    }
    await tx.insert(outbox).values({
      key: `webhook:${event.id}`,
      kind: "webhook",
      payload: { provider, reference, kind, merchantReference },
    });
    return { duplicate: false };
  });
}
export async function processRefund(refundId, adapter = executeRefund) {
  const context = await inventoryTransaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(refunds)
      .where(eq(refunds.id, refundId));
    if (!target) throw new Error("refund_not_found");
    const { session } = await lockOrder(tx, target.orderId);
    const [refund] = await tx
      .select()
      .from(refunds)
      .where(eq(refunds.id, refundId))
      .for("update");
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, refund.paymentId));
    if (["succeeded", "failed"].includes(refund.state))
      return { terminal: true };
    const submit = !refund.submittedAt;
    await tx
      .update(refunds)
      .set({
        state: "processing",
        submittedAt: refund.submittedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(refunds.id, refundId));
    return { refund, payment, session, submit };
  });
  if (context.terminal) return { done: true };
  let result;
  try {
    result = await adapter(context.refund, context.payment, context.session, {
      submit: context.submit,
    });
  } catch {
    result = { state: "needs_review", code: "provider_timeout_or_unavailable" };
  }
  const updated = await inventoryTransaction((tx) =>
    applyRefundResult(tx, refundId, {
      ...result,
      action: context.submit ? "submit" : "query",
    }),
  );
  return {
    done: ["succeeded", "failed"].includes(updated.state),
    review: updated.state === "needs_review",
  };
}
export async function processOutbox({
  limit = 5,
  key = null,
  deadline = Date.now() + 45000,
  refundAdapter = executeRefund,
} = {}) {
  let processed = 0,
    errors = 0;
  while (processed < limit && Date.now() < deadline - 35000) {
    const token = randomUUID();
    const claimed = await db.execute(
      sql`update outbox set state='processing',lease_token=${token}::uuid,lease_until=now()+interval '2 minutes',attempts=attempts+1,updated_at=now() where id=(select id from outbox where ((state='pending' and available_at<=now()) or (state='processing' and lease_until<now())) and (${key}::text is null or key=${key}) order by case when kind in ('refund','webhook') then 0 else 1 end,available_at,id for update skip locked limit 1) returning *`,
    );
    const row = claimed.rows[0];
    if (!row) break;
    let done = true,
      code = null;
    try {
      if (row.kind === "refund") {
        const result = await processRefund(row.payload.refundId, refundAdapter);
        done = result.done;
        if (!done)
          code = result.review ? "refund_needs_review" : "refund_pending";
      } else if (row.kind === "webhook") {
        if (row.payload.kind === "payment")
          await handleGatewayNotification(
            row.payload.provider,
            row.payload.reference,
          );
        else {
          const targets = await db
            .select()
            .from(refunds)
            .where(
              and(
                eq(refunds.provider, row.payload.provider),
                row.payload.merchantReference
                  ? eq(refunds.reference, row.payload.merchantReference)
                  : eq(refunds.providerRefundId, row.payload.reference),
              ),
            );
          if (
            row.payload.provider === "paypal" &&
            row.payload.merchantReference
          )
            for (const r of targets) {
              if (!r.providerRefundId)
                await db
                  .update(refunds)
                  .set({ providerRefundId: row.payload.reference })
                  .where(
                    and(
                      eq(refunds.id, r.id),
                      sql`${refunds.providerRefundId} is null`,
                    ),
                  );
            }
          for (const r of targets) await processRefund(r.id, refundAdapter);
        }
      } else if(row.kind === "newsletter_email") await dispatchNewsletter(row.payload);
      else if (row.kind === "order_email") await sendOrderEmail(row);
      else throw new Error("unsupported_work");
    } catch {
      done = false;
      code = "work_failed";
    }
    // Fenced completion: an expired worker cannot overwrite a newer claim.
    await db
      .update(outbox)
      .set({
        state: done ? "completed" : "pending",
        availableAt: new Date(
          Date.now() +
            Math.min(3600000, 60000 * 2 ** Math.min(row.attempts, 6)),
        ),
        leaseToken: null,
        leaseUntil: null,
        lastError: code,
        updatedAt: new Date(),
      })
      .where(and(eq(outbox.id, row.id), eq(outbox.leaseToken, token)));
    processed++;
    if (code) errors++;
  }
  return { processed, errors };
}
async function sendOrderEmail(row) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, row.payload.orderId));
  if(order.userId && !await transactionalEmailAllowed(order.userId)) return;
  const [owner] = order.userId
    ? await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, order.userId))
    : [];
  const email = owner?.email ?? order.guestEmail;
  if (email)
    await sendOrderEventEmail({
      email,
      code: order.code,
      event: row.payload.event,
      messageId: `<${row.id}@laptop-commerce.local>`,
    });
}
export async function runJob(name) {
  if (!["dispatch", "checkout", "images"].includes(name))
    throw Object.assign(new Error("Job không tồn tại."), { status: 404 });
  const token = randomUUID();
  const claim = await db.execute(
    sql`insert into job_lease(name,token,lease_until,last_started_at) values(${name},${token}::uuid,now()+interval '55 seconds',now()) on conflict(name) do update set token=excluded.token,lease_until=excluded.lease_until,last_started_at=now() where (job_lease.lease_until is null or job_lease.lease_until<now()) and (${name}<>'images' or job_lease.last_finished_at is null or job_lease.last_finished_at<now()-interval '1 hour') returning name`,
  );
  if (!claim.rows.length) return { skipped: true };
  let result,
    code = null;
  try {
    if (name === "dispatch") result = await processOutbox();
    else if (name === "checkout")
      result = await reconcileExpiredCheckouts({
        limit: 5,
        deadline: Date.now() + 45000,
      });
    else {
      await cleanupHttpSessions();
      const assets = await cleanupAssets({
        limit: 10,
        deadline: Date.now() + 45000,
      });
      result = {
        processed: assets.length,
        errors: assets.filter((a) => a.retry).length,
      };
    }
    if (Array.isArray(result))
      result = {
        processed: result.length,
        errors: result.filter((r) => r.ok === false).length,
      };
    if (result.errors) code = "work_errors";
  } catch {
    code = "job_failed";
    result = { failed: true };
  }
  await db
    .update(jobLeases)
    .set({
      leaseUntil: new Date(0),
      lastFinishedAt: new Date(),
      lastError: code,
      result,
    })
    .where(and(eq(jobLeases.name, name), eq(jobLeases.token, token)));
  return { result, ...(code ? { error: code } : {}) };
}
export async function operationsSummary() {
  const work = await db.execute(
    sql`select kind,state,count(*)::int as count,min(created_at) as oldest,max(last_error) as error from outbox where state<>'completed' group by kind,state`,
  );
  const cases = await db.execute(
    sql`select id,order_id,state,amount,provider,last_error,updated_at from refund where state in ('pending','processing','needs_review','failed') order by updated_at,id limit 100`,
  );
  const jobs = await db
    .select({
      name: jobLeases.name,
      lastStartedAt: jobLeases.lastStartedAt,
      lastFinishedAt: jobLeases.lastFinishedAt,
      lastError: jobLeases.lastError,
      result: jobLeases.result,
    })
    .from(jobLeases);
  const late = await db.execute(
    sql`select order_id,updated_at from checkout_session cs where state='paid_late' and not exists(select 1 from refund r where r.order_id=cs.order_id) order by updated_at limit 100`,
  );
  const returnCases = await db.execute(
    sql`select id,order_id,status,created_at,count(*) over()::int as total from sales_return where status not in ('completed','rejected') order by created_at,id limit 100`,
  );
  return {
    backlog: work.rows,
    refunds: cases.rows,
    jobs,
    paidLate: late.rows,
    returns: returnCases.rows,
  };
}
