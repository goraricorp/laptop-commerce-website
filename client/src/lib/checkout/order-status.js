const labels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  returned: "Hoàn trả",
};

// Payment and delivery remain independent: paying never completes delivery.
export function isAwaitingDelivery(order) {
  return (
    order.paymentStatus === "paid" &&
    ["confirmed", "processing"].includes(order.orderStatus) &&
    order.fulfillmentStatus !== "delivered"
  );
}

export function orderStatusLabel(order) {
  if (isAwaitingDelivery(order)) {
    return order.fulfillmentStatus === "shipped"
      ? "Đã thanh toán / Đang giao hàng"
      : "Đã thanh toán / Chờ giao hàng";
  }
  return labels[order.orderStatus] ?? order.orderStatus;
}

export function groupOrders(orders) {
  return {
    all: orders,
    processing: orders.filter(
      (order) =>
        ["pending", "confirmed", "processing"].includes(order.orderStatus) &&
        !isAwaitingDelivery(order),
    ),
    awaitingDelivery: orders.filter(isAwaitingDelivery),
    completed: orders.filter((order) => order.orderStatus === "completed"),
    cancelled: orders.filter((order) =>
      ["cancelled", "returned"].includes(order.orderStatus),
    ),
  };
}
