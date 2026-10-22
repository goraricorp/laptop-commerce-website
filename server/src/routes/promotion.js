import { Router } from "express";
import * as controller from "../controllers/promotion.js";
import { requireAdmin } from "../middlewares/admin.js";
import { requireAuth } from "../middlewares/auth.js";
const router = Router();
const adminOnly = [requireAuth, requireAdmin];
router
  .get("/promotion/code", controller.getPromotionCodes)
  .post("/promotion/code", ...adminOnly, controller.createPromotionCode);
router
  .get("/promotion/code/:id", controller.getPromotionCode)
  .patch("/promotion/code/:id", ...adminOnly, controller.updatePromotionCode)
  .put("/promotion/code/:id", ...adminOnly, controller.updatePromotionCode)
  .delete("/promotion/code/:id", ...adminOnly, controller.deletePromotionCode);
router.get("/promotion/usage", ...adminOnly, controller.getPromotionUsages);
router.get("/promotion/usage/:id", ...adminOnly, controller.getPromotionUsage);
router
  .get("/promotion", controller.getPromotions)
  .post("/promotion", ...adminOnly, controller.createPromotion);
router
  .get("/promotion/:id", controller.getPromotion)
  .patch("/promotion/:id", ...adminOnly, controller.updatePromotion)
  .put("/promotion/:id", ...adminOnly, controller.updatePromotion)
  .delete("/promotion/:id", ...adminOnly, controller.deletePromotion);
export default router;
