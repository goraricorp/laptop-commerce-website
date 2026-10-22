import { Router } from "express";
import {
  paypalCreateOrder,
  paypalCaptureOrder,
} from "../controllers/wallet.js";
import { requireAuth } from "../middlewares/auth.js";
import { clientUrl } from "../lib/utils/environment.js";
const router = Router();
router.use("/", requireAuth, (req, res, next) => {
  if (
    (req.get("origin") && req.get("origin") !== clientUrl) ||
    req.get("sec-fetch-site") === "cross-site"
  )
    return res.status(403).json({
      message: "Origin không được phép.",
    });
  return next();
});
// Legacy aliases now require an owned local order ID; client amounts are rejected.
router.post("/create", paypalCreateOrder);
router.post("/capture", paypalCaptureOrder);
export default router;
