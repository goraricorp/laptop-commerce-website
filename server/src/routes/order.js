import { Router } from "express";
import * as controller from "../controllers/order.js";
import { requireAdmin } from "../middlewares/admin.js";
import { requireAuth } from "../middlewares/auth.js";
import { listOrderPage } from "../services/order-list.js";
import { clientUrl } from "../lib/utils/environment.js";
const router = Router();
router.use("/", async (req, res, next) => {
  if (
    req.method !== "GET" &&
    ((req.get("origin") && req.get("origin") !== clientUrl) ||
      req.get("sec-fetch-site") === "cross-site")
  )
    return res.status(403).json({
      message: "Origin không được phép.",
    });
  await next();
});
router.get("/admin/orders", requireAuth, requireAdmin, async (req, res) => {
  res.set("Cache-Control", "no-store");
  return res.status(200).json(await listOrderPage(req.query));
});
for (const prefix of ["/order", "/payment", "/shipment"])
  router.use(`${prefix}`, requireAuth, requireAdmin);
router
  .get("/order/sale", controller.getOrders)
  .post("/order/sale", controller.createOrder);
router.patch("/order/sale/:id/status", controller.changeOrderStatus);
router
  .get("/order/sale/:id", controller.getOrder)
  .patch("/order/sale/:id", controller.updateOrder)
  .put("/order/sale/:id", controller.updateOrder)
  .delete("/order/sale/:id", controller.deleteOrder);
router
  .get("/order/item", controller.getOrderItems)
  .post("/order/item", controller.createOrderItem);
router
  .get("/order/item/:id", controller.getOrderItem)
  .patch("/order/item/:id", controller.updateOrderItem)
  .put("/order/item/:id", controller.updateOrderItem)
  .delete("/order/item/:id", controller.deleteOrderItem);
router
  .get("/order/address", controller.getOrderAddresses)
  .post("/order/address", controller.createOrderAddress);
router
  .get("/order/address/:id", controller.getOrderAddress)
  .patch("/order/address/:id", controller.updateOrderAddress)
  .put("/order/address/:id", controller.updateOrderAddress)
  .delete("/order/address/:id", controller.deleteOrderAddress);
router.get("/payment", controller.getPayments);
router.get("/payment/:id", controller.getPayment);
router.get("/shipment", controller.getShipments);
router.get("/shipment/:id", controller.getShipment);
router.get("/order/status-history", controller.getOrderStatusHistories);
router.get("/order/status-history/:id", controller.getOrderStatusHistory);
export default router;
