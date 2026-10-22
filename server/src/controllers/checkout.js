import { z } from "zod";
import * as checkout from "../services/checkout.js";
import { paymentMethods } from "../services/payment-gateways.js";
export const methods = (req, res) => res.status(200).json(paymentMethods());
export async function quote(req, res) {
  return res
    .status(200)
    .json(await checkout.quoteCheckout(req["user"].id, req["body"]));
}
export async function place(req, res) {
  return res
    .status(201)
    .json(await checkout.placeCheckout(req["user"].id, req["body"]));
}
export async function list(req, res) {
  return res
    .status(200)
    .json(await checkout.listCustomerOrders(req["user"].id, req.query));
}
export async function get(req, res) {
  return res
    .status(200)
    .json(
      await checkout.getCustomerOrder(
        req["user"].id,
        z.uuid().parse(req.params.id),
      ),
    );
}
export async function pay(req, res) {
  return res
    .status(200)
    .json(
      await checkout.initiatePayment(
        req["user"].id,
        z.uuid().parse(req.params.id),
      ),
    );
}
export async function refresh(req, res) {
  return res.status(200).json(
    await checkout.refreshPayment(
      req["user"].id,
      z.uuid().parse(req.params.id),
      {
        capture: true,
      },
    ),
  );
}
export async function cancel(req, res) {
  return res
    .status(200)
    .json(
      await checkout.cancelCheckout(
        req["user"].id,
        z.uuid().parse(req.params.id),
      ),
    );
}
