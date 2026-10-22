import {
  capturePaymentSchema,
  createPaymentSchema,
} from "../schemas/payment.js";
import {
  capturePaymentOrder,
  createPaymentOrder,
} from "../services/payment.js";
export async function createPayment(req, res) {
  const { totalPrice, currency } = createPaymentSchema.parse(req["body"]);
  const order = await createPaymentOrder(totalPrice, currency);
  return res.status(201).json({
    id: order.id,
  });
}
export async function capturePayment(req, res) {
  const { orderID } = capturePaymentSchema.parse(req["body"]);
  const details = await capturePaymentOrder(orderID);
  return res.status(200).json({
    status: "success",
    details,
  });
}
