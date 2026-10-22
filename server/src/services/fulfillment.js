import {activeOwner} from './account-state.js';
import { createHash, randomUUID } from "node:crypto";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "../database/index.js";
import {
  checkoutSessions,
  fulfillmentCommands,
  inventoryLocations,
  orderAllocations,
  orderFulfillments,
  orderItems,
  inventoryReservations,
  orders,
  orderStatusHistories,
  outbox,
  payments,
  refundAttempts,
  refunds,
  returnEvents,
  returnItems,
  returns,
  shipmentEvents,
  shipments,
} from "../database/schema.js";
import {
  inventoryTransaction,
  applyStockOperation,
  settleOrderStock,
} from "./stock-ledger.js";
import {
  allocateOrder,
  settlementRefund,
  unitAmount,
  vnd,
} from "../lib/orders/refund-allocation.js";
import {
  manualRefundInput,
  refundInput,
  returnCommandInput,
  returnInput,
  retryInput,
  shipmentInput,
} from "../schemas/fulfillment.js";

const error = (message, status = 409) =>
  Object.assign(new Error(message), { status });
const admin = (actor) => {
  if (!["administrator", "master"].includes(actor?.role))
    throw error("Không có quyền xử lý.", 403);
};
export async function enqueue(tx, key, kind, payload) {
  await tx.insert(outbox).values({ key, kind, payload }).onConflictDoNothing();
}
// Lock order: checkout session -> sales order -> fulfillment -> balances, shared by every command.
export async function lockOrder(tx, orderId) {
  const [session] = await tx
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.orderId, orderId))
    .for("update");
  const [order] = await tx
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .for("update");
  if (!order) throw error("Không tìm thấy đơn hàng.", 404);
  await tx.insert(orderFulfillments).values({ orderId }).onConflictDoNothing();
  const [fulfillment] = await tx
    .select()
    .from(orderFulfillments)
    .where(eq(orderFulfillments.orderId, orderId))
    .for("update");
  return { order, session, fulfillment };
}
async function command(orderId, actor, input, kind, action) {
  return inventoryTransaction(async (tx) => {
    const context = await lockOrder(tx, orderId);
    const hash = createHash("sha256")
      .update(JSON.stringify({ kind, input, actorId: actor.id, orderId }))
      .digest("hex");
    const inserted = await tx
      .insert(fulfillmentCommands)
      .values({ id: input.commandId, orderId, actorId: actor.id, hash })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) {
      const [old] = await tx
        .select()
        .from(fulfillmentCommands)
        .where(eq(fulfillmentCommands.id, input.commandId));
      if (old.hash !== hash)
        throw error("Mã thao tác đã dùng với nội dung khác.");
      return old.result;
    }
    const result = await action(tx, context);
    await tx
      .update(fulfillmentCommands)
      .set({ result })
      .where(eq(fulfillmentCommands.id, input.commandId));
    return result;
  });
}
async function allocation(tx, order) {
  const items = await tx
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.id));
  let rows = await tx
    .select()
    .from(orderAllocations)
    .where(eq(orderAllocations.orderId, order.id));
  if (!rows.length) {
    rows = allocateOrder(order, items);
    await tx.insert(orderAllocations).values(rows);
  }
  if (
    rows.length !== items.length ||
    rows.some(
      (r) =>
        !items.some(
          (i) =>
            i.id === r.orderItemId &&
            i.quantity === r.quantity &&
            vnd(i.total) === r.gross,
        ),
    ) ||
    rows.reduce((n, r) => n + r.net, 0) !==
      vnd(order.grandTotal) - vnd(order.shippingTotal)
  )
    throw error("Phân bổ chứng từ không khớp; cần đối soát.");
  return rows;
}
export async function shipmentCommand(orderId, raw, actor) {
  admin(actor);
  const input = shipmentInput.parse(raw);
  return command(
    orderId,
    actor,
    input,
    "shipment",
    async (tx, { order, session, fulfillment }) => {
      const rows = await tx
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, orderId))
        .for("update");
      if (rows.length > 1)
        throw error(
          "Đơn cũ có nhiều chuyến giao; cần đối soát trước khi xử lý.",
        );
      let shipment = rows[0];
      const now = new Date();
      if (input.action === "prepare") {
        if (
          shipment ||
          !["confirmed", "processing"].includes(order.orderStatus) ||
          fulfillment.stockIssuedAt
        )
          throw error("Không thể tạo chuyến giao cho trạng thái hiện tại.");
        if (!session)
          throw error(
            "Đơn cũ chưa có reservation đã xác minh; cần đối soát trước khi xuất kho.",
          );
        if (session.provider !== "cod" && session.state !== "paid")
          throw error("Đơn chưa thanh toán.");
        const paymentRows = await tx
          .select()
          .from(payments)
          .where(eq(payments.orderId, orderId))
          .for("update");
        if (
          paymentRows.length !== 1 ||
          paymentRows[0].provider !== session.provider ||
          vnd(paymentRows[0].amount) !== vnd(order.grandTotal)
        )
          throw error(
            "Khoản thu không khớp chứng từ; cần đối soát trước khi giao.",
          );
        if (!input.carrier || !input.trackingNumber)
          throw error("Cần đơn vị vận chuyển và mã vận đơn.", 400);
        [shipment] = await tx
          .insert(shipments)
          .values({
            orderId,
            carrier: input.carrier,
            trackingNumber: input.trackingNumber,
            status: "processing",
          })
          .returning();
        await tx
          .update(orders)
          .set({
            orderStatus: "processing",
            fulfillmentStatus: "processing",
            updatedAt: now,
          })
          .where(eq(orders.id, orderId));
      } else {
        if (!shipment) throw error("Chưa có chuyến giao.");
        if (order.orderStatus !== "processing")
          throw error("Đơn không còn được phép giao.");
        if (input.action === "handover") {
          if (
            shipment.status !== "processing" ||
            fulfillment.stockIssuedAt ||
            order.orderStatus !== "processing" ||
            !session ||
            (session.provider !== "cod" && session.state !== "paid")
          )
            throw error("Không thể bàn giao chuyến này.");
          const reserved = await tx
            .select()
            .from(inventoryReservations)
            .where(eq(inventoryReservations.orderId, orderId));
          const lines = await tx
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, orderId));
          const quantities = new Map();
          for (const line of lines)
            quantities.set(
              line.variantId,
              (quantities.get(line.variantId) ?? 0) + line.quantity,
            );
          if (
            !lines.length ||
            reserved.some((r) => r.state !== "reserved") ||
            [...quantities].some(
              ([variantId, quantity]) =>
                !variantId ||
                reserved
                  .filter((r) => r.variantId === variantId)
                  .reduce((n, r) => n + r.quantity, 0) !== quantity,
            ) ||
            reserved.some((r) => !quantities.has(r.variantId))
          )
            throw error(
              "Reservation không khớp chứng từ; cần đối soát trước khi xuất kho.",
            );
          await settleOrderStock(tx, session, "issued", actor.id);
          await tx
            .update(orderFulfillments)
            .set({ stockIssuedAt: now, updatedAt: now })
            .where(eq(orderFulfillments.orderId, orderId));
          [shipment] = await tx
            .update(shipments)
            .set({ status: "shipped", shippedAt: now, updatedAt: now })
            .where(eq(shipments.id, shipment.id))
            .returning();
          await tx
            .update(orders)
            .set({ fulfillmentStatus: "shipped", updatedAt: now })
            .where(eq(orders.id, orderId));
        } else if (input.action === "delivered") {
          if (
            !["shipped", "in_transit"].includes(shipment.status) ||
            !fulfillment.stockIssuedAt ||
            fulfillment.deliveredAt
          )
            throw error("Chỉ xác nhận giao sau khi xuất kho.");
          if (session?.provider === "cod") {
            if (!input.codProof) throw error("Cần chứng từ đã thu COD.", 400);
            await tx
              .update(payments)
              .set({
                status: "completed",
                paidAt: now,
                metadata: { codProof: input.codProof },
                updatedAt: now,
              })
              .where(eq(payments.orderId, orderId));
            await tx
              .update(checkoutSessions)
              .set({ state: "paid", updatedAt: now })
              .where(eq(checkoutSessions.id, session.id));
          }
          [shipment] = await tx
            .update(shipments)
            .set({ status: "delivered", deliveredAt: now, updatedAt: now })
            .where(eq(shipments.id, shipment.id))
            .returning();
          await tx
            .update(orderFulfillments)
            .set({ deliveredAt: now, updatedAt: now })
            .where(eq(orderFulfillments.orderId, orderId));
          await tx
            .update(orders)
            .set({
              orderStatus: "completed",
              fulfillmentStatus: "delivered",
              ...(session?.provider === "cod" ? { paymentStatus: "paid" } : {}),
              updatedAt: now,
            })
            .where(eq(orders.id, orderId));
          await tx
            .insert(orderStatusHistories)
            .values({ orderId, status: "completed", note: input.note });
        } else if (input.action === "retry") {
          if (
            (
              await tx
                .select()
                .from(returns)
                .where(
                  and(
                    eq(returns.orderId, orderId),
                    ne(returns.status, "rejected"),
                  ),
                )
            ).length
          )
            throw error("Đã có hồ sơ nhận lại hàng; không giao lại.");
          if (
            shipment.status !== "failed" ||
            !fulfillment.stockIssuedAt ||
            fulfillment.deliveredAt
          )
            throw error("Không thể giao lại chuyến này.");
          [shipment] = await tx
            .update(shipments)
            .set({ status: "shipped", updatedAt: now })
            .where(eq(shipments.id, shipment.id))
            .returning();
        } else {
          if (!["shipped", "in_transit"].includes(shipment.status))
            throw error("Không thể ghi nhận giao thất bại.");
          [shipment] = await tx
            .update(shipments)
            .set({ status: "failed", updatedAt: now })
            .where(eq(shipments.id, shipment.id))
            .returning();
          // Stock remains issued until explicitly received/inspected; never silently restock failed delivery.
        }
      }
      await tx.insert(shipmentEvents).values({
        orderId,
        shipmentId: shipment.id,
        actorId: actor.id,
        commandId: input.commandId,
        type: input.action,
        note: input.note,
      });
      await enqueue(tx, `shipment:${input.commandId}`, "order_email", {
        orderId,
        event: `shipment_${input.action}`,
      });
      return shipment;
    },
  );
}
export async function requestReturn(orderId, raw, actor) {
  const input = returnInput.parse(raw);
  return command(
    orderId,
    actor,
    input,
    "return",
    async (tx, { order, fulfillment }) => {
      await activeOwner(tx,actor.id);
      const staff = ["administrator", "master"].includes(actor.role);
      const [failedShipment] = staff
        ? await tx
            .select()
            .from(shipments)
            .where(
              and(
                eq(shipments.orderId, orderId),
                eq(shipments.status, "failed"),
              ),
            )
        : [];
      const failedDelivery = Boolean(
        staff &&
        failedShipment &&
        fulfillment.stockIssuedAt &&
        !fulfillment.deliveredAt &&
        order.orderStatus === "processing",
      );
      if (order.userId !== actor.id && !failedDelivery)
        throw error("Không tìm thấy đơn hàng.", 404);
      if (
        !failedDelivery &&
        (order.orderStatus !== "completed" ||
          !fulfillment.deliveredAt ||
          Date.now() - new Date(fulfillment.deliveredAt).getTime() >
            15 * 86400000 ||
          new Date(fulfillment.deliveredAt) > new Date())
      )
        throw error(
          "Đơn không còn trong thời hạn trả 15 ngày từ lúc giao thành công.",
        );
      const allocations = await allocation(tx, order);
      if (
        new Set(input.items.map((i) => i.orderItemId)).size !==
        input.items.length
      )
        throw error("Trùng dòng sản phẩm.", 400);
      const used = await tx
        .select({ item: returnItems, status: returns.status })
        .from(returnItems)
        .innerJoin(returns, eq(returns.id, returnItems.returnId))
        .where(
          and(eq(returns.orderId, orderId), ne(returns.status, "rejected")),
        );
      const [record] = await tx
        .insert(returns)
        .values({ orderId, userId: actor.id, reason: input.note })
        .returning();
      for (const item of input.items) {
        const a = allocations.find((a) => a.orderItemId === item.orderItemId);
        if (!a) throw error("Dòng sản phẩm không thuộc đơn.", 400);
        const claimed = new Set(
          used
            .filter((r) => r.item.orderItemId === item.orderItemId)
            .flatMap((r) => r.item.units),
        );
        const units = Array.from({ length: a.quantity }, (_, i) => i)
          .filter((i) => !claimed.has(i))
          .slice(0, item.quantity);
        if (units.length !== item.quantity)
          throw error("Số lượng vượt phần còn được trả.");
        await tx.insert(returnItems).values({
          returnId: record.id,
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          units,
        });
      }
      await tx.insert(returnEvents).values({
        returnId: record.id,
        actorId: actor.id,
        commandId: input.commandId,
        status: "requested",
        note: input.note,
      });
      await enqueue(tx, `return:${input.commandId}`, "order_email", {
        orderId,
        event: "return_requested",
      });
      return record;
    },
  );
}
export async function returnCommand(returnId, raw, actor) {
  admin(actor);
  const input = returnCommandInput.parse(raw);
  const [target] = await db
    .select()
    .from(returns)
    .where(eq(returns.id, returnId));
  if (!target) throw error("Không tìm thấy hồ sơ trả hàng.", 404);
  return command(
    target.orderId,
    actor,
    { ...input, returnId },
    "return_command",
    async (tx, { order }) => {
      const [record] = await tx
        .select()
        .from(returns)
        .where(eq(returns.id, returnId))
        .for("update");
      const next = {
        approve: ["requested", "approved"],
        reject: ["requested", "rejected"],
        receive: ["approved", "received"],
        inspect: ["received", "inspected"],
        complete: ["inspected", "completed"],
      }[input.action];
      if (record.status !== next[0])
        throw error("Trạng thái trả hàng không hợp lệ.");
      if (input.action === "inspect") {
        const items = await tx
          .select()
          .from(returnItems)
          .where(eq(returnItems.returnId, returnId));
        if (
          !input.items ||
          input.items.length !== items.length ||
          new Set(input.items.map((i) => i.itemId)).size !== items.length
        )
          throw error("Cần kiểm đủ từng dòng trả hàng.", 400);
        const allocations = await allocation(tx, order);
        const moves = [];
        for (const entry of input.items) {
          const item = items.find((i) => i.id === entry.itemId);
          if (
            !item ||
            entry.acceptedQuantity > item.quantity ||
            entry.restockQuantity > entry.acceptedQuantity ||
            (entry.restockQuantity &&
              (entry.condition !== "resellable" || !entry.locationId))
          )
            throw error("Số lượng/tình trạng nhập lại không hợp lệ.", 400);
          const a = allocations.find((a) => a.orderItemId === item.orderItemId);
          if (entry.restockQuantity) {
            const [location] = await tx
              .select()
              .from(inventoryLocations)
              .where(
                and(
                  eq(inventoryLocations.id, entry.locationId),
                  eq(inventoryLocations.isActive, true),
                ),
              )
              .for("share");
            const [line] = await tx
              .select()
              .from(orderItems)
              .where(eq(orderItems.id, item.orderItemId));
            if (!location || !line.variantId)
              throw error("Kho hoặc SKU không còn hợp lệ.");
            moves.push({
              locationId: entry.locationId,
              variantId: line.variantId,
              type: "return",
              quantity: entry.restockQuantity,
              onHandDelta: entry.restockQuantity,
              reservedDelta: 0,
            });
          }
          await tx
            .update(returnItems)
            .set({
              acceptedQuantity: entry.acceptedQuantity,
              restockQuantity: entry.restockQuantity,
              locationId: entry.locationId ?? null,
              condition: entry.condition,
              note: entry.note,
              refundAmount:
                order.paymentStatus === "unpaid"
                  ? 0
                  : unitAmount(a, item.units.slice(0, entry.acceptedQuantity)),
            })
            .where(eq(returnItems.id, item.id));
        }
        if (moves.length)
          await applyStockOperation(tx, {
            key: `return:${returnId}:inspect`,
            kind: "return",
            actorId: actor.id,
            referenceType: "return",
            referenceId: returnId,
            note: input.note,
            movements: moves,
          });
      }
      if (input.action === "complete") {
        const items = await tx
          .select()
          .from(returnItems)
          .where(eq(returnItems.returnId, returnId));
        const [refund] = await tx
          .select()
          .from(refunds)
          .where(
            and(eq(refunds.returnId, returnId), eq(refunds.state, "succeeded")),
          );
        if (
          items.some((i) => i.refundAmount > 0) &&
          refund?.state !== "succeeded"
        )
          throw error("Chờ hoàn tiền thành công trước khi đóng hồ sơ.");
      }
      if (input.action === "complete") {
        const all = await tx
          .select({ status: returns.status, item: returnItems })
          .from(returns)
          .innerJoin(returnItems, eq(returnItems.returnId, returns.id))
          .where(eq(returns.orderId, order.id));
        const lines = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        if (
          lines.every(
            (line) =>
              all
                .filter(
                  (r) =>
                    r.item.orderItemId === line.id &&
                    (r.status === "completed" || r.item.returnId === returnId),
                )
                .reduce((n, r) => n + r.item.acceptedQuantity, 0) ===
              line.quantity,
          )
        ) {
          await tx
            .update(orders)
            .set({
              orderStatus: "returned",
              fulfillmentStatus: "returned",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));
          await tx.insert(orderStatusHistories).values({
            orderId: order.id,
            status: "returned",
            note: input.note,
          });
        }
      }
      const [updated] = await tx
        .update(returns)
        .set({ status: next[1], updatedAt: new Date() })
        .where(eq(returns.id, returnId))
        .returning();
      await tx.insert(returnEvents).values({
        returnId,
        actorId: actor.id,
        commandId: input.commandId,
        status: next[1],
        note: input.note,
      });
      await enqueue(tx, `return:${input.commandId}`, "order_email", {
        orderId: order.id,
        event: `return_${next[1]}`,
      });
      return updated;
    },
  );
}
export async function createRefund(orderId, raw, actor) {
  admin(actor);
  const input = refundInput.parse(raw);
  return command(
    orderId,
    actor,
    input,
    "refund",
    async (tx, { order, session, fulfillment }) => {
      const paymentRows = await tx
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .for("update");
      if (paymentRows.length !== 1 || paymentRows[0].status !== "completed")
        throw error("Chưa có một khoản thu đã xác minh; cần đối soát.");
      const payment = paymentRows[0],
        existing = await tx
          .select()
          .from(refunds)
          .where(eq(refunds.orderId, orderId));
      const held = existing.filter((r) => r.state !== "failed");
      if (
        ["refunded", "partially_refunded"].includes(order.paymentStatus) &&
        !existing.some((r) => r.state === "succeeded")
      )
        throw error(
          "Chứng từ cũ có hoàn tiền nhưng chưa có ledger hoàn; cần đối soát trước khi tạo khoản mới.",
        );
      if (input.shippingAmount && !input.shippingReason)
        throw error("Hoàn phí giao cần lý do riêng.", 400);
      const shippingUsed = held.reduce((n, r) => n + r.shippingAmount, 0);
      if (shippingUsed + input.shippingAmount > vnd(order.shippingTotal))
        throw error("Vượt phí giao đã thu.");
      let goods;
      if (input.purpose === "return") {
        const [record] = await tx
          .select()
          .from(returns)
          .where(
            and(
              eq(returns.id, input.returnId ?? randomUUID()),
              eq(returns.orderId, orderId),
            ),
          );
        if (
          !record ||
          !["inspected", "completed"].includes(record.status) ||
          existing.some((r) => r.returnId === record.id && r.state !== "failed")
        )
          throw error("Hồ sơ chưa kiểm hàng hoặc đã có khoản hoàn.");
        const items = await tx
          .select()
          .from(returnItems)
          .where(eq(returnItems.returnId, record.id));
        goods = items.reduce((n, i) => n + i.refundAmount, 0);
      } else if (input.purpose === "paid_cancellation") {
        if (
          input.returnId ||
          fulfillment.stockIssuedAt ||
          fulfillment.deliveredAt ||
          ["completed", "returned"].includes(order.orderStatus) ||
          held.length
        )
          throw error(
            "Chỉ hủy có hoàn tiền trước khi xuất kho, chưa có hồ sơ hoàn khác.",
          );
        goods = vnd(order.grandTotal) - vnd(order.shippingTotal);
        if (session) await settleOrderStock(tx, session, "released", actor.id);
        await tx
          .update(orders)
          .set({
            orderStatus: "cancelled",
            fulfillmentStatus: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
        await tx.insert(orderStatusHistories).values({
          orderId,
          status: "cancelled",
          note: `Admin hủy đơn đã thu tiền: ${input.note}`,
        });
        // Voucher is deliberately NOT restored for any paid refund/cancellation.
      }
      if (input.purpose === "shipping") {
        if (input.returnId || !input.shippingAmount)
          throw error("Hoàn riêng phí giao cần số tiền và lý do.", 400);
        goods = 0;
      }
      const amount = goods + input.shippingAmount,
        used = held.reduce((n, r) => n + r.amount, 0);
      if (amount < 1 || used + amount > vnd(payment.amount))
        throw error("Khoản hoàn vượt tiền đã thu hoặc bằng 0.");
      if (
        !["cod", "stripe", "paypal", "momo", "zalopay"].includes(
          payment.provider,
        )
      )
        throw error("Provider chưa hỗ trợ hoàn tiền.", 503);
      const currency = session?.currency ?? payment.metadata?.currency ?? "VND";
      const providerAmount = settlementRefund(
        vnd(payment.amount),
        session?.providerAmount ??
          payment.metadata?.providerAmount ??
          payment.amount,
        used,
        held.reduce((n, r) => n + Number(r.providerAmount), 0),
        amount,
        currency,
      );
      const refundId = randomUUID();
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date());
      const d = (type) => date.find((p) => p.type === type).value;
      const reference =
        payment.provider === "zalopay"
          ? `${d("year")}${d("month")}${d("day")}_${(await import("../lib/utils/environment.js")).zalopayAppId}_${refundId.replaceAll("-", "").slice(0, 20)}`
          : refundId;
      const [refund] = await tx
        .insert(refunds)
        .values({
          id: refundId,
          orderId,
          returnId: input.returnId ?? null,
          paymentId: payment.id,
          actorId: actor.id,
          purpose: input.purpose,
          reason:
            input.note +
            (input.shippingReason ? `\nPhí giao: ${input.shippingReason}` : ""),
          amount,
          shippingAmount: input.shippingAmount,
          provider: payment.provider,
          currency,
          providerAmount,
          reference,
        })
        .returning();
      if (payment.provider !== "cod")
        await enqueue(tx, `refund:${refund.id}`, "refund", {
          refundId: refund.id,
        });
      return refund;
    },
  );
}
export async function applyRefundResult(tx, refundId, result) {
  const [target] = await tx
    .select()
    .from(refunds)
    .where(eq(refunds.id, refundId));
  if (!target) throw error("Không tìm thấy khoản hoàn.", 404);
  await lockOrder(tx, target.orderId);
  const [refund] = await tx
    .select()
    .from(refunds)
    .where(eq(refunds.id, refundId))
    .for("update");
  if (["succeeded", "failed"].includes(refund.state)) return refund;
  if (
    result.state === "succeeded" &&
    (!result.verified ||
      result.reference !== refund.reference ||
      Number(result.amount) !== Number(refund.providerAmount) ||
      result.currency !== refund.currency)
  )
    throw error("Kết quả hoàn tiền chưa khớp chứng từ.");
  if (
    !["processing", "succeeded", "failed", "needs_review"].includes(
      result.state,
    )
  )
    throw error("Kết quả hoàn không hợp lệ.");
  // Definitive failure is accepted only from a verified provider response.
  const state =
    result.state === "failed" && !result.verified
      ? "needs_review"
      : result.state;
  const [updated] = await tx
    .update(refunds)
    .set({
      state,
      providerRefundId: result.id ?? refund.providerRefundId,
      lastError: result.code ?? null,
      updatedAt: new Date(),
    })
    .where(eq(refunds.id, refundId))
    .returning();
  await tx.insert(refundAttempts).values({
    refundId,
    action: result.action ?? "query",
    state,
    code: result.code ?? null,
  });
  if (state === "succeeded") {
    if (refund.purpose === "paid_cancellation")
      await tx
        .update(payments)
        .set({
          metadata: sql`${payments.metadata} || ${JSON.stringify({ requiresRefund: false, resolvedRefundId: refund.id })}::jsonb`,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, refund.paymentId));
    const all = await tx
      .select()
      .from(refunds)
      .where(
        and(
          eq(refunds.orderId, refund.orderId),
          eq(refunds.state, "succeeded"),
        ),
      );
    const sum = all.reduce((n, r) => n + r.amount, 0),
      [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, refund.paymentId));
    await tx
      .update(orders)
      .set({
        paymentStatus:
          sum === vnd(payment.amount) ? "refunded" : "partially_refunded",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, refund.orderId));
    await enqueue(tx, `refund-email:${refundId}`, "order_email", {
      orderId: refund.orderId,
      event: "refund_succeeded",
    });
  }
  return updated;
}
export async function confirmManualRefund(refundId, raw, actor) {
  admin(actor);
  const input = manualRefundInput.parse(raw),
    [target] = await db.select().from(refunds).where(eq(refunds.id, refundId));
  if (!target) throw error("Không tìm thấy khoản hoàn.", 404);
  return command(
    target.orderId,
    actor,
    { ...input, refundId },
    "manual_refund",
    async (tx) => {
      const [refund] = await tx
        .select()
        .from(refunds)
        .where(eq(refunds.id, refundId))
        .for("update");
      if (refund.provider !== "cod" || refund.state !== "pending")
        throw error("Chỉ xác nhận thủ công khoản hoàn COD đang chờ.");
      await tx
        .update(refunds)
        .set({ proof: input.proof })
        .where(eq(refunds.id, refundId));
      return applyRefundResult(tx, refundId, {
        state: "succeeded",
        verified: true,
        reference: refund.reference,
        amount: refund.providerAmount,
        currency: refund.currency,
        action: "manual",
        code: "manual_proof_recorded",
      });
    },
  );
}
export async function reconcileRefund(refundId, raw, actor) {
  admin(actor);
  const input = retryInput.parse(raw),
    [target] = await db.select().from(refunds).where(eq(refunds.id, refundId));
  if (!target) throw error("Không tìm thấy khoản hoàn.", 404);
  return command(
    target.orderId,
    actor,
    { ...input, refundId },
    "refund_reconcile",
    async (tx) => {
      if (
        target.provider === "cod" ||
        ["succeeded", "failed"].includes(target.state)
      )
        throw error("Khoản hoàn không cần đối soát provider.");
      if (input.providerRefundId) {
        if (target.provider !== "paypal")
          throw error(
            "Chỉ bổ sung mã PayPal chưa biết; kết quả vẫn cần xác minh với provider.",
          );
        await tx
          .update(refunds)
          .set({ providerRefundId: input.providerRefundId })
          .where(eq(refunds.id, refundId));
      }
      await tx
        .update(outbox)
        .set({ state: "pending", availableAt: new Date(), lastError: null })
        .where(
          and(
            eq(outbox.key, `refund:${refundId}`),
            ne(outbox.state, "processing"),
          ),
        );
      return {
        queued: true,
        refundId,
        providerRefundId: input.providerRefundId ?? target.providerRefundId,
        previousProviderRefundId: target.providerRefundId,
      };
    },
  );
}
export async function fulfillmentDetail(orderId, actor) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  const staff = ["administrator", "master"].includes(actor?.role);
  if (!order || (!staff && order.userId !== actor?.id))
    throw error("Không tìm thấy đơn hàng.", 404);
  const [fulfillment] = await db
    .select()
    .from(orderFulfillments)
    .where(eq(orderFulfillments.orderId, orderId));
  const shipmentsRows = await db
    .select()
    .from(shipments)
    .where(eq(shipments.orderId, orderId));
  const returnRows = await db
    .select()
    .from(returns)
    .where(eq(returns.orderId, orderId))
    .orderBy(asc(returns.createdAt));
  const records = [];
  for (const r of returnRows)
    records.push({
      ...r,
      items: await db
        .select()
        .from(returnItems)
        .where(eq(returnItems.returnId, r.id)),
      events: await db
        .select({
          status: returnEvents.status,
          note: returnEvents.note,
          createdAt: returnEvents.createdAt,
        })
        .from(returnEvents)
        .where(eq(returnEvents.returnId, r.id))
        .orderBy(asc(returnEvents.createdAt)),
    });
  const refundRows = await db
    .select()
    .from(refunds)
    .where(eq(refunds.orderId, orderId));
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  return {
    orderId,
    fulfillment: fulfillment ?? null,
    shipments: shipmentsRows,
    events: await db
      .select({
        type: shipmentEvents.type,
        note: shipmentEvents.note,
        createdAt: shipmentEvents.createdAt,
      })
      .from(shipmentEvents)
      .where(eq(shipmentEvents.orderId, orderId))
      .orderBy(asc(shipmentEvents.createdAt)),
    items: items.map((i) => ({
      ...i,
      returnableQuantity:
        i.quantity -
        records
          .filter((r) => r.status !== "rejected")
          .flatMap((r) => r.items)
          .filter((r) => r.orderItemId === i.id)
          .reduce((n, r) => n + r.quantity, 0),
    })),
    returns: records,
    refunds: refundRows.map((r) =>
      staff
        ? r
        : {
            id: r.id,
            returnId: r.returnId,
            state: r.state,
            amount: r.amount,
            shippingAmount: r.shippingAmount,
            createdAt: r.createdAt,
          },
    ),
    canRequestReturn:
      order.orderStatus === "completed" &&
      Boolean(fulfillment?.deliveredAt) &&
      Date.now() - new Date(fulfillment.deliveredAt).getTime() <=
        15 * 86400000 &&
      new Date(fulfillment.deliveredAt) <= new Date(),
  };
}
