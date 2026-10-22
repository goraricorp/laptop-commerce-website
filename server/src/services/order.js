import { inventoryTransaction } from "./stock-ledger.js";

import { cancelCheckout, finishCheckoutOrder } from "./checkout.js";
import { eq } from "drizzle-orm";
import { db } from "../database/index.js";
import {
  checkoutSessions,
  orderAddresses,
  orderItems,
  orders,
  orderStatusHistories,
  payments,
  shipments,
} from "../database/schema.js";

const allowedStatusTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["cancelled"],
  completed: [],
  cancelled: [],
  returned: [],
};

function serviceError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function assertUnmanagedOrder(orderId) {
  const { orderFulfillments } = await import("../database/schema.js");
  if (
    (
      await db
        .select()
        .from(orderFulfillments)
        .where(eq(orderFulfillments.orderId, orderId))
    )[0]
  )
    throw serviceError(
      "Đơn có lịch sử nghiệp vụ; không sửa/xóa chứng từ trực tiếp.",
      409,
    );
  if (
    (
      await db
        .select()
        .from(checkoutSessions)
        .where(eq(checkoutSessions.orderId, orderId))
    )[0]
  )
    throw serviceError(
      "Dữ liệu đơn checkout phải được thay đổi qua nghiệp vụ đặt hàng/thanh toán.",
      409,
    );
}
async function assertUnmanagedEntity(table, id, newOrderId) {
  const row = (await db.select().from(table).where(eq(table.id, id)))[0];
  if (row) await assertUnmanagedOrder(row.orderId);
  if (newOrderId) await assertUnmanagedOrder(newOrderId);
}

export async function getOrders() {
  return await db.select().from(orders);
}
export async function getOrder(id) {
  return (
    (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0] ??
    null
  );
}
export async function createOrder(data) {
  return (await db.insert(orders).values(data).returning())[0];
}
export async function updateOrder(id, data) {
  if (Object.keys(data).some((key) => key !== "note"))
    await assertUnmanagedOrder(id);
  const managed = (
    await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.orderId, id))
  )[0];
  if (managed && Object.keys(data).some((key) => key !== "note"))
    throw serviceError(
      "Đơn checkout chỉ cho sửa ghi chú; đổi trạng thái qua nghiệp vụ đơn hàng.",
      409,
    );
  const safeData = { ...data };
  delete safeData.orderStatus;
  return (
    (
      await db.update(orders).set(safeData).where(eq(orders.id, id)).returning()
    )[0] ?? null
  );
}
export async function deleteOrder(id) {
  await assertUnmanagedOrder(id);
  if (
    (
      await db
        .select()
        .from(checkoutSessions)
        .where(eq(checkoutSessions.orderId, id))
    )[0]
  )
    throw serviceError("Không xóa đơn checkout; sử dụng hủy đơn.", 409);
  return (
    (await db.delete(orders).where(eq(orders.id, id)).returning())[0] ?? null
  );
}
export async function changeOrderStatus(id, data, actor) {
  if (["completed", "returned"].includes(data.status))
    throw serviceError(
      "Giao/hoàn hàng phải qua command vận chuyển/trả hàng.",
      409,
    );
  if (data.status === "cancelled") {
    const managed = (
      await db
        .select()
        .from(checkoutSessions)
        .where(eq(checkoutSessions.orderId, id))
    )[0];
    if (managed) {
      await cancelCheckout(managed.userId, id, actor?.id);
      return getOrder(id);
    }
  }
  return await inventoryTransaction(async (transaction) => {
    await transaction
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.orderId, id))
      .for("update");
    const current = (
      await transaction
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .for("update")
    )[0];
    if (!current) throw serviceError("Không tìm thấy đơn hàng", 404);
    if (current.orderStatus === data.status) return current;
    if (!allowedStatusTransitions[current.orderStatus]?.includes(data.status)) {
      throw serviceError(
        `Không thể chuyển trạng thái từ ${current.orderStatus} sang ${data.status}`,
      );
    }

    await finishCheckoutOrder(transaction, id, data.status, actor?.id);
    const updated = (
      await transaction
        .update(orders)
        .set({
          orderStatus: data.status,
          ...(data.status === "processing"
            ? { fulfillmentStatus: "processing" }
            : data.status === "completed"
              ? { fulfillmentStatus: "delivered" }
              : data.status === "cancelled"
                ? { fulfillmentStatus: "cancelled" }
                : {}),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning()
    )[0];
    await transaction
      .insert(orderStatusHistories)
      .values({ orderId: id, status: data.status, note: data.note ?? null });
    return updated;
  });
}
export async function getOrderItems() {
  return await db.select().from(orderItems);
}
export async function getOrderItem(id) {
  return (
    (
      await db.select().from(orderItems).where(eq(orderItems.id, id)).limit(1)
    )[0] ?? null
  );
}
export async function createOrderItem(data) {
  await assertUnmanagedOrder(data.orderId);
  return (await db.insert(orderItems).values(data).returning())[0];
}
export async function updateOrderItem(id, data) {
  await assertUnmanagedEntity(orderItems, id, data.orderId);
  return (
    (
      await db
        .update(orderItems)
        .set(data)
        .where(eq(orderItems.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteOrderItem(id) {
  await assertUnmanagedEntity(orderItems, id);
  return (
    (await db.delete(orderItems).where(eq(orderItems.id, id)).returning())[0] ??
    null
  );
}
export async function getOrderAddresses() {
  return await db.select().from(orderAddresses);
}
export async function getOrderAddress(id) {
  return (
    (
      await db
        .select()
        .from(orderAddresses)
        .where(eq(orderAddresses.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createOrderAddress(data) {
  await assertUnmanagedOrder(data.orderId);
  return (await db.insert(orderAddresses).values(data).returning())[0];
}
export async function updateOrderAddress(id, data) {
  await assertUnmanagedEntity(orderAddresses, id, data.orderId);
  return (
    (
      await db
        .update(orderAddresses)
        .set(data)
        .where(eq(orderAddresses.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteOrderAddress(id) {
  await assertUnmanagedEntity(orderAddresses, id);
  return (
    (
      await db
        .delete(orderAddresses)
        .where(eq(orderAddresses.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function getPayments() {
  return await db.select().from(payments);
}
export async function getPayment(id) {
  return (
    (await db.select().from(payments).where(eq(payments.id, id)).limit(1))[0] ??
    null
  );
}
export async function createPayment(data) {
  await assertUnmanagedOrder(data.orderId);
  return (await db.insert(payments).values(data).returning())[0];
}
export async function updatePayment(id, data) {
  await assertUnmanagedEntity(payments, id, data.orderId);
  return (
    (
      await db.update(payments).set(data).where(eq(payments.id, id)).returning()
    )[0] ?? null
  );
}
export async function deletePayment(id) {
  await assertUnmanagedEntity(payments, id);
  return (
    (await db.delete(payments).where(eq(payments.id, id)).returning())[0] ??
    null
  );
}
export async function getShipments() {
  return await db.select().from(shipments);
}
export async function getShipment(id) {
  return (
    (
      await db.select().from(shipments).where(eq(shipments.id, id)).limit(1)
    )[0] ?? null
  );
}
export async function createShipment(data) {
  return (await db.insert(shipments).values(data).returning())[0];
}
export async function updateShipment(id, data) {
  return (
    (
      await db
        .update(shipments)
        .set(data)
        .where(eq(shipments.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteShipment(id) {
  return (
    (await db.delete(shipments).where(eq(shipments.id, id)).returning())[0] ??
    null
  );
}
export async function getOrderStatusHistories() {
  return await db.select().from(orderStatusHistories);
}
export async function getOrderStatusHistory(id) {
  return (
    (
      await db
        .select()
        .from(orderStatusHistories)
        .where(eq(orderStatusHistories.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createOrderStatusHistory(data) {
  return (await db.insert(orderStatusHistories).values(data).returning())[0];
}
export async function updateOrderStatusHistory(id, data) {
  return (
    (
      await db
        .update(orderStatusHistories)
        .set(data)
        .where(eq(orderStatusHistories.id, id))
        .returning()
    )[0] ?? null
  );
}
export async function deleteOrderStatusHistory(id) {
  return (
    (
      await db
        .delete(orderStatusHistories)
        .where(eq(orderStatusHistories.id, id))
        .returning()
    )[0] ?? null
  );
}
