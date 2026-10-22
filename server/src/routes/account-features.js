import { publicRateLimit } from "../middlewares/public-rate-limit.js";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import { requireModerator } from "../middlewares/moderator.js";
import { rateLimit } from "../middlewares/rate-limit.js";
import { clientUrl } from "../lib/utils/environment.js";
import * as features from "../services/account-features.js";
import * as support from "../services/support.js";
import {
  anonymizeAccount,
  transferMaster,
} from "../services/account-lifecycle.js";
import { picker } from "../services/pickers.js";
import {
  productEditorDetail,
  saveProductEditor,
} from "../services/product-editor.js";
const router = Router(),
  id = (req) => z.uuid().parse(req.params["id"]);
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
for (const path of [
  "/me/favorites",
  "/me/preferences",
  "/me/account",
  "/me/support",
])
  router.use(path, requireAuth, origin);
router.get("/me/favorites", async (req, res) =>
  res.status(200).json(await features.favoriteList(req["user"].id, req.query)),
);
router.get("/me/favorites/:id", async (req, res) =>
  res
    .status(200)
    .json(await features.favoriteStatus(req["user"].id, id(req, res))),
);
router.put("/me/favorites/:id", async (req, res) => {
  z.object({}).strict().parse(req["body"]);
  return res
    .status(200)
    .json(await features.setFavorite(req["user"].id, id(req, res), true));
});
router.delete("/me/favorites/:id", async (req, res) =>
  res
    .status(200)
    .json(await features.setFavorite(req["user"].id, id(req, res), false)),
);
router.get("/me/preferences", async (req, res) =>
  res.status(200).json(await features.preferences(req["user"].id)),
);
router.patch("/me/preferences", async (req, res) =>
  res.status(200).json(await features.preferences(req["user"].id, req["body"])),
);
router.post("/catalog/comparison", origin, async (req, res) =>
  res.status(200).json(await features.comparison(req["body"])),
);
router.post(
  "/newsletter/subscribe",
  origin,
  publicRateLimit("newsletter", 5),
  async (req, res) =>
    res.status(202).json(await features.subscribeNewsletter(req["body"])),
);
router.post(
  "/newsletter/action",
  origin,
  publicRateLimit("newsletter-action", 10),
  async (req, res) =>
    res.status(200).json(await features.newsletterAction(req["body"])),
);
router.post(
  "/me/account/delete",
  rateLimit({
    scope: "account-delete",
    limit: 5,
    windowMs: 60000,
  }),
  async (req, res) =>
    res.status(200).json(await anonymizeAccount(req["auth"], req["body"])),
);
router.post("/me/account/transfer-master", async (req, res) =>
  res.status(200).json(await transferMaster(req["auth"], req["body"])),
);
router.get("/me/support", async (req, res) =>
  res.status(200).json(
    await support.listTickets(req.query, {
      ...req["user"],
      role: "user",
    }),
  ),
);
router.post(
  "/me/support",
  rateLimit({
    scope: "support-create",
    limit: 10,
    windowMs: 60000,
  }),
  async (req, res) =>
    res.status(201).json(await support.createTicket(req["body"], req["user"])),
);
router.get("/me/support/:id", async (req, res) =>
  res.status(200).json(await support.getTicket(id(req, res), req["user"])),
);
router.get("/me/support/:id/messages", async (req, res) =>
  res
    .status(200)
    .json(await support.ticketMessages(id(req, res), req.query, req["user"])),
);
router.post("/me/support/:id/messages", async (req, res) =>
  res
    .status(201)
    .json(await support.replyTicket(id(req, res), req["body"], req["user"])),
);
router.post("/me/support/:id/status", async (req, res) =>
  res
    .status(200)
    .json(await support.ticketStatus(id(req, res), req["body"], req["user"])),
);
router.use("/staff/support", requireAuth, requireModerator, origin);
router.get("/staff/support", async (req, res) =>
  res.status(200).json(await support.listTickets(req.query, req["user"])),
);
router.post("/staff/support/:id/assign", async (req, res) =>
  res
    .status(200)
    .json(await support.assignTicket(id(req, res), req["body"], req["user"])),
);
router.get("/staff/support/:id", async (req, res) =>
  res.status(200).json(await support.getTicket(id(req, res), req["user"])),
);
router.get("/staff/support/:id/messages", async (req, res) =>
  res
    .status(200)
    .json(await support.ticketMessages(id(req, res), req.query, req["user"])),
);
router.post("/staff/support/:id/messages", async (req, res) =>
  res
    .status(201)
    .json(await support.replyTicket(id(req, res), req["body"], req["user"])),
);
router.post("/staff/support/:id/status", async (req, res) =>
  res
    .status(200)
    .json(await support.ticketStatus(id(req, res), req["body"], req["user"])),
);
router.use("/admin/pickers", requireAuth, requireAdmin, origin);
router.get("/admin/pickers/:resource", async (req, res) =>
  res.status(200).json(await picker(req.params["resource"], req.query)),
);
router.get("/admin/pickers/:resource/:id", async (req, res) =>
  res
    .status(200)
    .json(await picker(req.params["resource"], req.query, id(req, res))),
);
router.use("/admin/product-editor", requireAuth, requireAdmin, origin);
router.get("/admin/product-editor/:id", async (req, res) => {
  const result = await productEditorDetail(id(req, res));
  return result
    ? res.status(200).json(result)
    : res.status(404).json({
        message: "Không tìm thấy sản phẩm.",
      });
});
router.put("/admin/product-editor/:id", async (req, res) =>
  res
    .status(200)
    .json(await saveProductEditor(id(req, res), req["body"], req["user"])),
);
export default router;
