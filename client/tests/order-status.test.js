import { describe, expect, it } from "vitest";
import {
  groupOrders,
  isAwaitingDelivery,
  orderStatusLabel,
} from "../src/lib/checkout/order-status.js";

describe("paid order delivery stage", () => {
  const cod = {
    id: "cod",
    orderStatus: "confirmed",
    paymentStatus: "unpaid",
    fulfillmentStatus: "unfulfilled",
  };
  const paid = {
    id: "online",
    orderStatus: "confirmed",
    paymentStatus: "paid",
    fulfillmentStatus: "unfulfilled",
  };
  it("moves a verified paid order into waiting for delivery while COD stays processing", () => {
    const groups = groupOrders([cod, paid]);
    expect(groups.processing).toEqual([cod]);
    expect(groups.awaitingDelivery).toEqual([paid]);
    expect(groups.completed).toEqual([]);
    expect(orderStatusLabel(paid)).toBe("Đã thanh toán / Chờ giao hàng");
    expect(isAwaitingDelivery({ ...paid, paymentStatus: "pending" })).toBe(
      false,
    );
  });
  it("completes only after delivery, and never treats cancelled late payments as waiting", () => {
    const completed = {
      ...paid,
      orderStatus: "completed",
      fulfillmentStatus: "delivered",
    };
    const cancelled = { ...paid, orderStatus: "cancelled" };
    expect(groupOrders([completed, cancelled]).awaitingDelivery).toEqual([]);
    expect(orderStatusLabel(completed)).toBe("Hoàn thành");
    expect(orderStatusLabel(cancelled)).toBe("Đã hủy");
    expect(orderStatusLabel({ ...paid, fulfillmentStatus: "shipped" })).toBe(
      "Đã thanh toán / Đang giao hàng",
    );
  });
});
