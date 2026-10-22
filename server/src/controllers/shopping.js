import * as shoppingService from "../services/shopping.js";
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
export async function getAddresses(req, res) {
  return sendList(req, res, await shoppingService.getAddresses());
}
export async function getAddress(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.getAddress(req.params.id),
    "Address",
  );
}
export async function createAddress(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.createAddress(req["body"]),
    "Address",
    201,
  );
}
export async function updateAddress(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.updateAddress(req.params.id, req["body"]),
    "Address",
  );
}
export async function deleteAddress(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.deleteAddress(req.params.id),
    "Address",
  );
}
export async function getCarts(req, res) {
  return sendList(req, res, await shoppingService.getCarts());
}
export async function getCart(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.getCart(req.params.id),
    "Cart",
  );
}
export async function createCart(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.createCart(req["body"]),
    "Cart",
    201,
  );
}
export async function updateCart(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.updateCart(req.params.id, req["body"]),
    "Cart",
  );
}
export async function deleteCart(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.deleteCart(req.params.id),
    "Cart",
  );
}
export async function getCartItems(req, res) {
  return sendList(req, res, await shoppingService.getCartItems());
}
export async function getCartItem(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.getCartItem(req.params.id),
    "Cart item",
  );
}
export async function createCartItem(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.createCartItem(req["body"]),
    "Cart item",
    201,
  );
}
export async function updateCartItem(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.updateCartItem(req.params.id, req["body"]),
    "Cart item",
  );
}
export async function deleteCartItem(req, res) {
  return sendItem(
    req,
    res,
    await shoppingService.deleteCartItem(req.params.id),
    "Cart item",
  );
}
