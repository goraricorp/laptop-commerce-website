import { Router } from "express";
import { rateLimit } from "../middlewares/rate-limit.js";
import * as controller from "../controllers/wallet.js";
import { requireAuth } from "../middlewares/auth.js";
import { clientUrl } from "../lib/utils/environment.js";
const router = Router();
// Provider notifications are authenticated by signatures, not browser sessions.
router.post("/paypal/webhook", controller.paypalWebhook);
router.post("/momo/callback", controller.momoCallback);
router.post("/zalopay/callback", controller.zalopayCallback);
router.use(
  "/",
  requireAuth,
  rateLimit({
    scope: "wallet",
    windowMs: 60000,
    limit: 30,
  }),
  (req, res, next) => {
    if (
      (req.get("origin") && req.get("origin") !== clientUrl) ||
      req.get("sec-fetch-site") === "cross-site"
    )
      return res.status(403).json({
        message: "Origin không được phép.",
      });
    return next();
  },
);
router.post("/momo", controller.momoPayment);
router.post("/zalopay", controller.zalopayPayment);
router.post("/paypal", controller.paypalCreateOrder);
router.post("/paypal/capture", controller.paypalCaptureOrder);
router.post("/stripe", controller.stripePayment);
router.post("/stripe/sheet", controller.stripeSelection);
router.post("/vnpay", controller.vnpayPayment);
export default router;
