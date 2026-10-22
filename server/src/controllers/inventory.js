import { z } from "zod";
import * as inventoryService from "../services/inventory.js";
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
export async function getInventoryLocations(req, res) {
  return sendList(req, res, await inventoryService.getInventoryLocations());
}
export async function getInventoryLocation(req, res) {
  return sendItem(
    req,
    res,
    await inventoryService.getInventoryLocation(z.uuid().parse(req.params.id)),
    "Inventory location",
  );
}
export async function createInventoryLocation(req, res) {
  return sendItem(
    req,
    res,
    await inventoryService.createInventoryLocation(req["body"]),
    "Inventory location",
    201,
  );
}
export async function updateInventoryLocation(req, res) {
  return sendItem(
    req,
    res,
    await inventoryService.updateInventoryLocation(
      z.uuid().parse(req.params.id),
      req["body"],
    ),
    "Inventory location",
  );
}
export async function deleteInventoryLocation(req, res) {
  return sendItem(
    req,
    res,
    await inventoryService.deleteInventoryLocation(
      z.uuid().parse(req.params.id),
    ),
    "Inventory location",
  );
}
export async function getInventoryBalances(req, res) {
  return sendList(req, res, await inventoryService.getInventoryBalances());
}
export async function getInventoryBalance(req, res) {
  return sendItem(
    req,
    res,
    await inventoryService.getInventoryBalance(
      z.uuid().parse(req.params.locationId),
      z.uuid().parse(req.params.variantId),
    ),
    "Inventory balance",
  );
}
export async function updateInventoryBalance(req, res) {
  return sendItem(
    req,
    res,
    await inventoryService.updateInventoryBalance(
      z.uuid().parse(req.params.locationId),
      z.uuid().parse(req.params.variantId),
      req["body"],
    ),
    "Inventory balance",
  );
}
export async function getStockMovements(req, res) {
  return sendList(req, res, await inventoryService.getStockMovements());
}
export async function getStockMovement(req, res) {
  return sendItem(
    req,
    res,
    await inventoryService.getStockMovement(z.uuid().parse(req.params.id)),
    "Stock movement",
  );
}
export async function createStockMovement(req, res) {
  return sendItem(
    req,
    res,
    await inventoryService.createStockMovement(req["body"], req["user"]),
    "Stock movement",
    201,
  );
}
