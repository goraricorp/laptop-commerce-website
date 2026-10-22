import { Router } from "express";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import process from "node:process";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import { clientUrl } from "../lib/utils/environment.js";
import * as service from "../services/fulfillment.js";
import { operationsSummary, runJob } from "../services/jobs.js";
const router = Router();
const id = (req) => z.uuid().parse(req.params["id"]);
const origin = async (req, res, next) => {
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
};
router.use("/me/orders/:id/fulfillment", requireAuth, origin);
router.use("/me/orders/:id/returns", requireAuth, origin);
router.get("/me/orders/:id/fulfillment", async (req, res) =>
  res
    .status(200)
    .json(await service.fulfillmentDetail(id(req, res), req["user"])),
);
router.post("/me/orders/:id/returns", async (req, res) =>
  res
    .status(201)
    .json(await service.requestReturn(id(req, res), req["body"], req["user"])),
);
router.use("/admin/fulfillment", requireAuth, requireAdmin, origin);
router.get("/admin/fulfillment/orders/:id", async (req, res) =>
  res
    .status(200)
    .json(await service.fulfillmentDetail(id(req, res), req["user"])),
);
router.post("/admin/fulfillment/orders/:id/shipment", async (req, res) =>
  res
    .status(200)
    .json(
      await service.shipmentCommand(id(req, res), req["body"], req["user"]),
    ),
);
router.post("/admin/fulfillment/orders/:id/returns", async (req, res) =>
  res
    .status(201)
    .json(await service.requestReturn(id(req, res), req["body"], req["user"])),
);
router.post("/admin/fulfillment/orders/:id/refunds", async (req, res) =>
  res
    .status(201)
    .json(await service.createRefund(id(req, res), req["body"], req["user"])),
);
router.post("/admin/fulfillment/returns/:id", async (req, res) =>
  res
    .status(200)
    .json(await service.returnCommand(id(req, res), req["body"], req["user"])),
);
router.post("/admin/fulfillment/refunds/:id/confirm", async (req, res) =>
  res
    .status(200)
    .json(
      await service.confirmManualRefund(id(req, res), req["body"], req["user"]),
    ),
);
router.post("/admin/fulfillment/refunds/:id/reconcile", async (req, res) =>
  res
    .status(200)
    .json(
      await service.reconcileRefund(id(req, res), req["body"], req["user"]),
    ),
);
router.get("/admin/fulfillment/operations", async (req, res) =>
  res.status(200).json(await operationsSummary()),
);
router.post("/internal/jobs/:name", async (req, res) => {
  const secret = process.env.INTERNAL_JOB_SECRET;
  if (!secret || secret.length < 32)
    return res.status(503).json({
      message: "Job chưa được cấu hình.",
    });
  const actual = Buffer.from(req.get("authorization") ?? ""),
    expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return res.status(401).json({
      message: "Unauthorized",
    });
  res.set("Cache-Control", "no-store");
  const result = await runJob(req.params["name"]);
  return res.status(result.error ? 503 : 200).json(result);
});
export default router;
