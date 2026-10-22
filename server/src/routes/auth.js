import { toNodeHandler } from "better-auth/node";
import { jsonBody } from "../middlewares/body.js";
import { z } from "zod";
import { saveAccountProfile } from "../services/account-profile.js";
import { Router } from "express";
import { auth } from "../lib/auth/index.js";
import { betterAuthUrl } from "../lib/utils/environment.js";
import { requireAuth } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rate-limit.js";
import { googleOptions } from "../lib/auth/google.js";
import { unlinkConnectedAccount } from "../services/connected-accounts.js";
import { clientUrl } from "../lib/utils/environment.js";
const router = Router();
const profileOrigin = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (
    req.get("origin") !== clientUrl ||
    req.get("sec-fetch-site") === "cross-site"
  )
    return res.status(403).json({
      message: "Origin không được phép.",
    });
  await next();
};
router.post(
  "/update-user",
  requireAuth,
  profileOrigin,
  jsonBody,
  async (req, res) => {
    await saveAccountProfile(req["auth"], req.body);
    return res.status(200).json({
      status: true,
    });
  },
);
router.post(
  "/admin/update-user",
  requireAuth,
  profileOrigin,
  jsonBody,
  async (req, res) => {
    const { userId, data } = z
      .object({
        userId: z.uuid(),
        data: z.record(z.string(), z.unknown()),
      })
      .strict()
      .parse(req.body);
    return res.status(200).json({
      user: await saveAccountProfile(req["auth"], data, {
        targetId: userId,
        admin: true,
      }),
    });
  },
);
router.get("/providers", (req, res) =>
  res.status(200).json({
    google: {
      enabled: Boolean(googleOptions().google),
      reason: googleOptions().google ? null : "not_configured",
    },
  }),
);
router.post(
  "/unlink-account",
  requireAuth,
  rateLimit({
    scope: "account-linking",
    windowMs: 60000,
    limit: 10,
  }),
  jsonBody,
  async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (
      req.get("origin") !== clientUrl ||
      req.get("sec-fetch-site") === "cross-site"
    )
      return res.status(403).json({
        message: "Origin không được phép.",
      });
    try {
      return res
        .status(200)
        .json(await unlinkConnectedAccount(req["auth"], await req.body));
    } catch (error) {
      if (error instanceof SyntaxError)
        return res.status(400).json({
          message: "JSON không hợp lệ.",
        });
      if (error.body?.code)
        return res.status(error.statusCode ?? 400).json({
          code: error.body.code,
          message: error.body.message,
        });
      throw error;
    }
  },
);
const nativeAuth = toNodeHandler(auth);
router.all("/{*path}", (req, res, next) => {
  // Express strips the /auth mount before Better Auth receives the request.
  const pathname = new URL(betterAuthUrl).pathname.replace(/\/$/, "");
  const query = req.url.includes("?")
    ? req.url.slice(req.url.indexOf("?"))
    : "";
  req.url = pathname + req.path + query;
  req.originalUrl = req.url;
  req.baseUrl = "";
  return nativeAuth(req, res).catch(next);
});
export default router;
