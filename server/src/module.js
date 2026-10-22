import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import process from "node:process";
import { auxiliarySession } from "./middlewares/session.js";
import { checkContentLength, maxRequestSize } from "./middlewares/body.js";
import { clientUrl } from "./lib/utils/environment.js";
import { parseBody } from "./middlewares/body.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";
import accountFeaturesRoute from "./routes/account-features.js";
import fulfillmentRoute from "./routes/fulfillment.js";
import authRoute from "./routes/auth.js";
import uploadRoute from "./routes/upload.js";
import checkoutRoute from "./routes/checkout.js";
import walletRoute from "./routes/wallet.js";
import myAddressesRoute from "./routes/my-addresses.js";
import myCartRoute from "./routes/my-cart.js";
import myVouchersRoute from "./routes/my-vouchers.js";
import statisticsRoute from "./routes/statistics.js";
import captchaRoute from "./routes/captcha.js";
import paypalRoute from "./routes/paypal.js";
import catalogRoute from "./routes/catalog.js";
import inventoryRoute from "./routes/inventory.js";
import shoppingRoute from "./routes/shopping.js";
import orderRoute from "./routes/order.js";
import promotionRoute from "./routes/promotion.js";
import reviewRoute from "./routes/review.js";
import chatRoute from "./routes/chat.js";
import { stripeWebhook } from "./controllers/wallet.js";

export default function AppModule() {
  const app = express();
  app.disable("x-powered-by");
  app.disable("etag");
  // Local clients cannot choose their address with forwarded headers.
  app.set("trust proxy", process.env.VERCEL === "1" ? 1 : false);
  app.set("query parser", "simple");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: clientUrl,
      credentials: true,
      methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Accept",
        "Authorization",
        "Content-Type",
        "X-Requested-With",
      ],
      maxAge: 86400,
    }),
  );
  app.use(checkContentLength);
  app.use(compression());
  app.use(cookieParser());
  app.get("/health", (req, res) =>
    res.json({ status: "ok", service: "laptop-commerce-website-server" }),
  );
  // Native Better Auth must receive its unparsed request stream.
  app.use("/auth", authRoute);
  // Stripe signatures cover the exact bytes, before any JSON/body parser.
  app.post(
    "/wallet/stripe/webhook",
    express.raw({ type: () => true, limit: maxRequestSize }),
    stripeWebhook,
  );
  app.use(parseBody);
  app.use(auxiliarySession());
  for (const route of [
    accountFeaturesRoute,
    fulfillmentRoute,
    myVouchersRoute,
    statisticsRoute,
    myCartRoute,
    checkoutRoute,
    myAddressesRoute,
    uploadRoute,
    catalogRoute,
    inventoryRoute,
    shoppingRoute,
    orderRoute,
    promotionRoute,
    reviewRoute,
    chatRoute,
  ])
    app.use(route);
  app.use("/wallet", walletRoute);
  app.use("/recaptcha", captchaRoute);
  app.use("/paypal", paypalRoute);
  app.get("/", (req, res) =>
    res.json({ service: "laptop-commerce-website-server" }),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
