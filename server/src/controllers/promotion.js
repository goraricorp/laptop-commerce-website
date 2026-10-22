import * as promotionService from "../services/promotion.js";
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
export async function getPromotions(req, res) {
  return sendList(req, res, await promotionService.getPromotions());
}
export async function getPromotion(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.getPromotion(req.params.id),
    "Promotion",
  );
}
export async function createPromotion(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.createPromotion(req["body"]),
    "Promotion",
    201,
  );
}
export async function updatePromotion(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.updatePromotion(req.params.id, req["body"]),
    "Promotion",
  );
}
export async function deletePromotion(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.deletePromotion(req.params.id),
    "Promotion",
  );
}
export async function getPromotionCodes(req, res) {
  return sendList(req, res, await promotionService.getPromotionCodes());
}
export async function getPromotionCode(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.getPromotionCode(req.params.id),
    "Promotion code",
  );
}
export async function createPromotionCode(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.createPromotionCode(req["body"]),
    "Promotion code",
    201,
  );
}
export async function updatePromotionCode(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.updatePromotionCode(req.params.id, req["body"]),
    "Promotion code",
  );
}
export async function deletePromotionCode(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.deletePromotionCode(req.params.id),
    "Promotion code",
  );
}
export async function getPromotionUsages(req, res) {
  return sendList(req, res, await promotionService.getPromotionUsages());
}
export async function getPromotionUsage(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.getPromotionUsage(req.params.id),
    "Promotion usage",
  );
}
export async function createPromotionUsage(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.createPromotionUsage(req["body"]),
    "Promotion usage",
    201,
  );
}
export async function updatePromotionUsage(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.updatePromotionUsage(req.params.id, req["body"]),
    "Promotion usage",
  );
}
export async function deletePromotionUsage(req, res) {
  return sendItem(
    req,
    res,
    await promotionService.deletePromotionUsage(req.params.id),
    "Promotion usage",
  );
}
