import { Router } from "express";
import { rateLimit } from "../middlewares/rate-limit.js";
import * as controller from "../controllers/checkout.js";
import { requireAuth } from "../middlewares/auth.js";
import { clientUrl } from "../lib/utils/environment.js";
const router = Router();
router.get("/checkout/methods", controller.methods);
for (const prefix of ["/checkout", "/me/orders"])
  router.use(`${prefix}`, requireAuth, (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (
      req.method !== "GET" &&
      ((req.get("origin") && req.get("origin") !== clientUrl) ||
        req.get("sec-fetch-site") === "cross-site")
    )
      return res.status(403).json({
        message: "Origin không được phép.",
      });
    return next();
  });
router.use(
  "/checkout",
  rateLimit({
    scope: "checkout",
    windowMs: 60000,
    limit: 40,
  }),
);
router.post("/checkout/quote", controller.quote);
router.post("/checkout/orders", controller.place);
router.post("/checkout/orders/:id/pay", controller.pay);
router.post("/checkout/orders/:id/refresh", controller.refresh);
router.post("/checkout/orders/:id/cancel", controller.cancel);
router.get("/me/orders", controller.list);
router.get("/me/orders/:id", controller.get);
export default router;
