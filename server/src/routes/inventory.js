import { Router } from "express";
import * as controller from "../controllers/inventory.js";
import { requireAdmin } from "../middlewares/admin.js";
import { requireAuth } from "../middlewares/auth.js";
import {
  transferStock,
  reconcileInventory,
  getInventoryOperation,
  reconcileStockBalance,
} from "../services/inventory.js";
import { clientUrl } from "../lib/utils/environment.js";
const router = Router();
router.use("/inventory", requireAuth, requireAdmin, async (req, res, next) => {
  res.set("Cache-Control", "no-store");
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
router.post("/inventory/transfers", async (req, res) =>
  res.status(201).json(await transferStock(req["body"], req["user"])),
);
router.post("/inventory/reconciliation/adjust", async (req, res) =>
  res.status(200).json(await reconcileStockBalance(req["body"], req["user"])),
);
router.get("/inventory/reconciliation", async (req, res) =>
  res.status(200).json(await reconcileInventory()),
);
router.get("/inventory/operations/:id", async (req, res) => {
  const row = await getInventoryOperation(req.params["id"]);
  return row
    ? res.status(200).json(row)
    : res.status(404).json({
        message: "Không tìm thấy operation.",
      });
});
router
  .get("/inventory/location", controller.getInventoryLocations)
  .post("/inventory/location", controller.createInventoryLocation);
router
  .get("/inventory/location/:id", controller.getInventoryLocation)
  .patch("/inventory/location/:id", controller.updateInventoryLocation)
  .put("/inventory/location/:id", controller.updateInventoryLocation)
  .delete("/inventory/location/:id", controller.deleteInventoryLocation);
router.get("/inventory/balance", controller.getInventoryBalances);
router
  .get(
    "/inventory/balance/:locationId/:variantId",
    controller.getInventoryBalance,
  )
  .patch(
    "/inventory/balance/:locationId/:variantId",
    controller.updateInventoryBalance,
  )
  .put(
    "/inventory/balance/:locationId/:variantId",
    controller.updateInventoryBalance,
  );
router
  .get("/inventory/stock/movement", controller.getStockMovements)
  .post("/inventory/stock/movement", controller.createStockMovement);
router.get("/inventory/stock/movement/:id", controller.getStockMovement);
export default router;
