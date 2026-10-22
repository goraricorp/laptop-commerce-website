import { z } from "zod";
import * as orderService from "../services/order.js";
function sendList(req, res, items) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  return res.status(200).json({
    items: items.slice(offset, offset + limit),
    page,
    limit,
    total: items.length,
  });
}
function sendItem(req, res, item, name, status = 200) {
  return item
    ? res.status(status).json(item)
    : res.status(404).json({
        message: `${name} not found`,
      });
}
export async function getOrders(req, res) {
  return sendList(req, res, await orderService.getOrders());
}
export async function getOrder(req, res) {
  return sendItem(
    req,
    res,
    await orderService.getOrder(req.params.id),
    "Order",
  );
}
export async function createOrder(req, res) {
  return sendItem(
    req,
    res,
    await orderService.createOrder(req["body"]),
    "Order",
    201,
  );
}
export async function updateOrder(req, res) {
  return sendItem(
    req,
    res,
    await orderService.updateOrder(req.params.id, req["body"]),
    "Order",
  );
}
export async function deleteOrder(req, res) {
  return sendItem(
    req,
    res,
    await orderService.deleteOrder(req.params.id),
    "Order",
  );
}
export async function changeOrderStatus(req, res) {
  return sendItem(
    req,
    res,
    await orderService.changeOrderStatus(
      z.uuid().parse(req.params.id),
      z
        .object({
          status: z.enum([
            "pending",
            "confirmed",
            "processing",
            "completed",
            "cancelled",
            "returned",
          ]),
          note: z.string().max(2000).nullable().optional(),
        })
        .strict()
        .parse(req["body"]),
      req["user"],
    ),
    "Order",
  );
}
export async function getOrderItems(req, res) {
  return sendList(req, res, await orderService.getOrderItems());
}
export async function getOrderItem(req, res) {
  return sendItem(
    req,
    res,
    await orderService.getOrderItem(req.params.id),
    "Order item",
  );
}
export async function createOrderItem(req, res) {
  return sendItem(
    req,
    res,
    await orderService.createOrderItem(req["body"]),
    "Order item",
    201,
  );
}
export async function updateOrderItem(req, res) {
  return sendItem(
    req,
    res,
    await orderService.updateOrderItem(req.params.id, req["body"]),
    "Order item",
  );
}
export async function deleteOrderItem(req, res) {
  return sendItem(
    req,
    res,
    await orderService.deleteOrderItem(req.params.id),
    "Order item",
  );
}
export async function getOrderAddresses(req, res) {
  return sendList(req, res, await orderService.getOrderAddresses());
}
export async function getOrderAddress(req, res) {
  return sendItem(
    req,
    res,
    await orderService.getOrderAddress(req.params.id),
    "Order address",
  );
}
export async function createOrderAddress(req, res) {
  return sendItem(
    req,
    res,
    await orderService.createOrderAddress(req["body"]),
    "Order address",
    201,
  );
}
export async function updateOrderAddress(req, res) {
  return sendItem(
    req,
    res,
    await orderService.updateOrderAddress(req.params.id, req["body"]),
    "Order address",
  );
}
export async function deleteOrderAddress(req, res) {
  return sendItem(
    req,
    res,
    await orderService.deleteOrderAddress(req.params.id),
    "Order address",
  );
}
export async function getPayments(req, res) {
  return sendList(req, res, await orderService.getPayments());
}
export async function getPayment(req, res) {
  return sendItem(
    req,
    res,
    await orderService.getPayment(req.params.id),
    "Payment",
  );
}
export async function createPayment(req, res) {
  return sendItem(
    req,
    res,
    await orderService.createPayment(req["body"]),
    "Payment",
    201,
  );
}
export async function updatePayment(req, res) {
  return sendItem(
    req,
    res,
    await orderService.updatePayment(req.params.id, req["body"]),
    "Payment",
  );
}
export async function deletePayment(req, res) {
  return sendItem(
    req,
    res,
    await orderService.deletePayment(req.params.id),
    "Payment",
  );
}
export async function getShipments(req, res) {
  return sendList(req, res, await orderService.getShipments());
}
export async function getShipment(req, res) {
  return sendItem(
    req,
    res,
    await orderService.getShipment(req.params.id),
    "Shipment",
  );
}
export async function createShipment(req, res) {
  return sendItem(
    req,
    res,
    await orderService.createShipment(req["body"]),
    "Shipment",
    201,
  );
}
export async function updateShipment(req, res) {
  return sendItem(
    req,
    res,
    await orderService.updateShipment(req.params.id, req["body"]),
    "Shipment",
  );
}
export async function deleteShipment(req, res) {
  return sendItem(
    req,
    res,
    await orderService.deleteShipment(req.params.id),
    "Shipment",
  );
}
export async function getOrderStatusHistories(req, res) {
  return sendList(req, res, await orderService.getOrderStatusHistories());
}
export async function getOrderStatusHistory(req, res) {
  return sendItem(
    req,
    res,
    await orderService.getOrderStatusHistory(req.params.id),
    "Order status history",
  );
}
export async function createOrderStatusHistory(req, res) {
  return sendItem(
    req,
    res,
    await orderService.createOrderStatusHistory(req["body"]),
    "Order status history",
    201,
  );
}
export async function updateOrderStatusHistory(req, res) {
  return sendItem(
    req,
    res,
    await orderService.updateOrderStatusHistory(req.params.id, req["body"]),
    "Order status history",
  );
}
export async function deleteOrderStatusHistory(req, res) {
  return sendItem(
    req,
    res,
    await orderService.deleteOrderStatusHistory(req.params.id),
    "Order status history",
  );
}
