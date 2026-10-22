import * as catalogService from "../services/catalog.js";
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
  if (!item)
    return res.status(404).json({
      message: `${name} not found`,
    });
  return res.status(status).json(item);
}
export async function getCategories(req, res) {
  return sendList(req, res, await catalogService.getCategories());
}
export async function getCategory(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.getCategory(req.params.id),
    "Category",
  );
}
export async function createCategory(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.createCategory(req["body"]),
    "Category",
    201,
  );
}
export async function updateCategory(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.updateCategory(req.params.id, req["body"]),
    "Category",
  );
}
export async function deleteCategory(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.deleteCategory(req.params.id),
    "Category",
  );
}
export async function getBrands(req, res) {
  return sendList(req, res, await catalogService.getBrands());
}
export async function getBrand(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.getBrand(req.params.id),
    "Brand",
  );
}
export async function createBrand(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.createBrand(req["body"]),
    "Brand",
    201,
  );
}
export async function updateBrand(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.updateBrand(req.params.id, req["body"]),
    "Brand",
  );
}
export async function deleteBrand(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.deleteBrand(req.params.id),
    "Brand",
  );
}
export async function getProducts(req, res) {
  return sendList(req, res, await catalogService.getProducts());
}
export async function getProduct(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.getProduct(req.params.id),
    "Product",
  );
}
export async function createProduct(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.createProduct(req["body"]),
    "Product",
    201,
  );
}
export async function updateProduct(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.updateProduct(req.params.id, req["body"]),
    "Product",
  );
}
export async function deleteProduct(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.deleteProduct(req.params.id),
    "Product",
  );
}
export async function getProductVariants(req, res) {
  return sendList(
    req,
    res,
    (await catalogService.getProductVariants()).filter(
      (item) => !req.query.productId || item.productId === req.query.productId,
    ),
  );
}
export async function getProductVariant(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.getProductVariant(req.params.id),
    "Product variant",
  );
}
export async function createProductVariant(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.createProductVariant(req["body"]),
    "Product variant",
    201,
  );
}
export async function updateProductVariant(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.updateProductVariant(req.params.id, req["body"]),
    "Product variant",
  );
}
export async function deleteProductVariant(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.deleteProductVariant(req.params.id),
    "Product variant",
  );
}
export async function getAttributes(req, res) {
  return sendList(req, res, await catalogService.getAttributes());
}
export async function getAttribute(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.getAttribute(req.params.id),
    "Attribute",
  );
}
export async function createAttribute(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.createAttribute(req["body"]),
    "Attribute",
    201,
  );
}
export async function updateAttribute(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.updateAttribute(req.params.id, req["body"]),
    "Attribute",
  );
}
export async function deleteAttribute(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.deleteAttribute(req.params.id),
    "Attribute",
  );
}
export async function getAttributeValues(req, res) {
  return sendList(req, res, await catalogService.getAttributeValues());
}
export async function getAttributeValue(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.getAttributeValue(req.params.id),
    "Attribute value",
  );
}
export async function createAttributeValue(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.createAttributeValue(req["body"]),
    "Attribute value",
    201,
  );
}
export async function updateAttributeValue(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.updateAttributeValue(req.params.id, req["body"]),
    "Attribute value",
  );
}
export async function deleteAttributeValue(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.deleteAttributeValue(req.params.id),
    "Attribute value",
  );
}
export async function getVariantAttributeValues(req, res) {
  return sendList(req, res, await catalogService.getVariantAttributeValues());
}
export async function getVariantAttributeValue(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.getVariantAttributeValue(
      req.params.variantId,
      req.params.attributeValueId,
    ),
    "Variant attribute value",
  );
}
export async function createVariantAttributeValue(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.createVariantAttributeValue(req["body"]),
    "Variant attribute value",
    201,
  );
}
export async function updateVariantAttributeValue(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.updateVariantAttributeValue(
      req.params.variantId,
      req.params.attributeValueId,
      req["body"],
    ),
    "Variant attribute value",
  );
}
export async function deleteVariantAttributeValue(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.deleteVariantAttributeValue(
      req.params.variantId,
      req.params.attributeValueId,
    ),
    "Variant attribute value",
  );
}
export async function getProductMedia(req, res) {
  return sendList(
    req,
    res,
    (await catalogService.getProductMedia()).filter(
      (item) => !req.query.productId || item.productId === req.query.productId,
    ),
  );
}
export async function getProductMedium(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.getProductMedium(req.params.id),
    "Product media",
  );
}
export async function createProductMedium(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.createProductMedium(req["body"]),
    "Product media",
    201,
  );
}
export async function updateProductMedium(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.updateProductMedium(req.params.id, req["body"]),
    "Product media",
  );
}
export async function deleteProductMedium(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.deleteProductMedium(req.params.id),
    "Product media",
  );
}
export async function getProductContentSections(req, res) {
  return sendList(req, res, await catalogService.getProductContentSections());
}
export async function getProductContentSection(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.getProductContentSection(req.params.id),
    "Product content section",
  );
}
export async function createProductContentSection(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.createProductContentSection(req["body"]),
    "Product content section",
    201,
  );
}
export async function updateProductContentSection(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.updateProductContentSection(
      req.params.id,
      req["body"],
    ),
    "Product content section",
  );
}
export async function deleteProductContentSection(req, res) {
  return sendItem(
    req,
    res,
    await catalogService.deleteProductContentSection(req.params.id),
    "Product content section",
  );
}
