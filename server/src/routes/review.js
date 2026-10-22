import { z } from "zod";
import * as service from "../services/review.js";
import { clientUrl } from "../lib/utils/environment.js";
import { Router } from "express";
import * as controller from "../controllers/review.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireModerator } from "../middlewares/moderator.js";
const router = Router();
const ownerPatch = z
  .object({
    score: z.number().int().min(1).max(5),
    title: z.string().trim().max(255).nullable().optional(),
    comment: z.string().trim().max(10000).nullable().optional(),
  })
  .strict();
router.use("/me/reviews", requireAuth, (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (
    req.method !== "GET" &&
    (req.get("sec-fetch-site") === "cross-site" ||
      (req.get("origin") && req.get("origin") !== clientUrl))
  )
    return res.status(403).json({
      message: "Origin không được phép.",
    });
  return next();
});
router.get("/me/reviews", async (req, res) => {
  return res.status(200).json(await service.getOwnedReviews(req["user"].id));
});
router.patch("/me/reviews/:id", async (req, res) => {
  const review = await service.updateOwnedReview(
    z.uuid().parse(req.params.id),
    req["user"].id,
    ownerPatch.parse(req["body"]),
  );
  if (!review)
    return res.status(404).json({
      message: "Không tìm thấy đánh giá của bạn.",
    });
  return res.status(200).json(review);
});
router.delete("/me/reviews/:id", async (req, res) => {
  const review = await service.deleteOwnedReview(
    z.uuid().parse(req.params.id),
    req["user"].id,
  );
  if (!review)
    return res.status(404).json({
      message: "Không tìm thấy đánh giá của bạn.",
    });
  return res.status(200).json(review);
});
router.get("/review", controller.getProductReviews);
router.post("/review", requireAuth, controller.createProductReview);
router.get(
  "/review/moderation",
  requireAuth,
  requireModerator,
  controller.getProductReviewsForModeration,
);
router.get("/review/summary", async (req, res) => {
  return res
    .status(200)
    .json(await service.reviewSummary(z.uuid().parse(req.query.productId)));
});
router.get(
  "/review/moderation/:id",
  requireAuth,
  requireModerator,
  async (req, res) => {
    const row = await service.getProductReview(
      z.uuid().parse(req.params["id"]),
    );
    return row
      ? res.status(200).json(row)
      : res.status(404).json({
          message: "Không tìm thấy đánh giá.",
        });
  },
);
router.get("/review/:id", controller.getProductReview);
router.patch(
  "/review/:id",
  requireAuth,
  requireModerator,
  controller.updateProductReview,
);
router.put(
  "/review/:id",
  requireAuth,
  requireModerator,
  controller.updateProductReview,
);
router.delete(
  "/review/:id",
  requireAuth,
  requireModerator,
  controller.deleteProductReview,
);
export default router;
