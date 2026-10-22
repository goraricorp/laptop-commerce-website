import { z } from "zod";
import { readPublicCatalog } from "../services/public-catalog.js";
import * as reviewService from "../services/review.js";
function sendList(req, res, items) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  return res.status(200).json({
    items: items.slice(offset, offset + limit),
    page,
    limit,
    total: items.length,
  });
}
function sendItem(req, res, item, name, status = 200) {
  return item
    ? res.status(status).json(item)
    : res.status(404).json({
        message: `${name} not found`,
      });
}
export async function getProductReviews(req, res) {
  return sendList(
    req,
    res,
    await reviewService.getPublishedProductReviews(
      req.query.productId ? z.uuid().parse(req.query.productId) : undefined,
    ),
  );
}
export async function getProductReviewsForModeration(req, res) {
  return sendList(req, res, await reviewService.getProductReviews());
}
export async function getProductReview(req, res) {
  return sendItem(
    req,
    res,
    await reviewService.getPublicProductReview(z.uuid().parse(req.params.id)),
    "Product review",
  );
}
export async function createProductReview(req, res) {
  const body = z
    .object({
      productId: z.uuid(),
      score: z.number().int().min(1).max(5),
      title: z.string().trim().max(255).nullable().optional(),
      comment: z.string().trim().max(10000).nullable().optional(),
    })
    .strict()
    .parse(req["body"]);
  if (
    !(await readPublicCatalog(
      "products",
      {},
      {
        id: body.productId,
      },
    ))
  )
    return res.status(404).json({
      message: "Sản phẩm không được mở bán.",
    });
  return sendItem(
    req,
    res,
    await reviewService.createProductReview({
      ...body,
      userId: req["user"].id,
      status: "pending",
      isVerifiedPurchase: false,
    }),
    "Product review",
    201,
  );
}
export async function updateProductReview(req, res) {
  return sendItem(
    req,
    res,
    await reviewService.updateProductReview(
      z.uuid().parse(req.params.id),
      z
        .object({
          status: z
            .enum(["pending", "published", "rejected", "hidden"])
            .optional(),
          score: z.number().int().min(1).max(5).optional(),
          title: z.string().max(255).nullable().optional(),
          comment: z.string().max(10000).nullable().optional(),
        })
        .strict()
        .refine((value) => Object.keys(value).length > 0)
        .parse(req["body"]),
    ),
    "Product review",
  );
}
export async function deleteProductReview(req, res) {
  return sendItem(
    req,
    res,
    await reviewService.deleteProductReview(z.uuid().parse(req.params.id)),
    "Product review",
  );
}
