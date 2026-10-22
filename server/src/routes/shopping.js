import { Router } from "express";
import * as controller from "../controllers/shopping.js";
import { requireAdmin } from "../middlewares/admin.js";
import { requireAuth } from "../middlewares/auth.js";
const router = Router();
router.use("/cart", requireAuth, requireAdmin);
router.use("/address", requireAuth, requireAdmin);
router
  .get("/address", controller.getAddresses)
  .post("/address", controller.createAddress);
router
  .get("/address/:id", controller.getAddress)
  .patch("/address/:id", controller.updateAddress)
  .put("/address/:id", controller.updateAddress)
  .delete("/address/:id", controller.deleteAddress);
router
  .get("/cart/item", controller.getCartItems)
  .post("/cart/item", controller.createCartItem);
router
  .get("/cart/item/:id", controller.getCartItem)
  .patch("/cart/item/:id", controller.updateCartItem)
  .put("/cart/item/:id", controller.updateCartItem)
  .delete("/cart/item/:id", controller.deleteCartItem);
router.get("/cart", controller.getCarts).post("/cart", controller.createCart);
router
  .get("/cart/:id", controller.getCart)
  .patch("/cart/:id", controller.updateCart)
  .put("/cart/:id", controller.updateCart)
  .delete("/cart/:id", controller.deleteCart);
export default router;
