export const tableRelations = {
  parentId: "categories",
  categoryId: "categories",
  brandId: "brands",
  productId: "products",
  variantId: "product-variants",
  attributeId: "attributes",
  attributeValueId: "attribute-values",
  locationId: "inventory-locations",
  promotionId: "promotions",
  promotionCodeId: "promotion-codes",
  userId: "users",
  actorId: "users",
  ownerId: "users",
  assignedToId: "users",
  senderUserId: "users",
  orderId: "orders",
  orderItemId: "order-items",
  cartId: "carts",
};
const hidden = new Set([
  "password",
  "accessToken",
  "refreshToken",
  "idToken",
  "token",
  "secret",
  "metadata",
  "requestHash",
  "fingerprint",
  "__mockOnly",
  "__tableId",
]);
export function embeddedRelationLabel(row, key) {
  const base = key.slice(0, -2);
  return row[`${base}Name`] ?? row[base]?.name;
}
export function tableKeys(rows) {
  return [...new Set(rows.flatMap(Object.keys))]
    .filter(
      (key) =>
        !hidden.has(key) &&
        (!/(?:^id$|Id$|_id$|^ids$)/.test(key) || tableRelations[key]),
    )
    .filter(
      (key) =>
        !key.endsWith("Name") ||
        !rows.some((row) => row[`${key.slice(0, -4)}Id`]),
    )
    .slice(0, 7);
}
export function relationRequests(rows, keys) {
  const grouped = new Map();
  for (const key of keys) {
    const resource = tableRelations[key];
    if (!resource) continue;
    if (!grouped.has(resource)) grouped.set(resource, new Set());
    for (const row of rows)
      if (row[key] && !embeddedRelationLabel(row, key))
        grouped.get(resource).add(row[key]);
  }
  return [...grouped].flatMap(([resource, values]) => {
    const ids = [...values].sort();
    return Array.from({ length: Math.ceil(ids.length / 50) }, (_, index) => ({
      resource,
      ids: ids.slice(index * 50, (index + 1) * 50),
    }));
  });
}
export function tableValue(row, key, relations) {
  if (!tableRelations[key] || !row[key]) return row[key];
  return (
    embeddedRelationLabel(row, key) ??
    relations[tableRelations[key]]?.[row[key]] ??
    "Chưa có tên hiển thị"
  );
}

const imageKeys = new Set([
  "image",
  "imageUrl",
  "logoUrl",
  "avatar",
  "avatarUrl",
]);
export function tableIdentityKey(resource, rows) {
  if (resource === "product-media") return "productId";
  return (
    [
      "name",
      "title",
      "subject",
      "value",
      "fileName",
      "filename",
      "recipientName",
      "customerName",
      "guestName",
      "email",
      "code",
      "sku",
    ].find((key) =>
      rows.some((row) => typeof row[key] === "string" && row[key].trim()),
    ) ??
    ["variantId", "productId", "userId", "attributeId", "locationId"].find(
      (key) => rows.some((row) => row[key]),
    ) ??
    (rows.some((row) => Object.keys(row).some((key) => imageKeys.has(key)))
      ? "__identity"
      : null)
  );
}
export function tableIdentity(resource, row, relations = {}) {
  const key = tableIdentityKey(resource, [row]);
  const title = String((key && tableValue(row, key, relations)) || "Hình ảnh");
  let description =
    row.description || row.summary || row.slug || row.code || row.sku || "";
  if (resource === "products")
    description = [row.slug, row.summary].filter(Boolean).join(" | ");
  if (resource === "users") description = row.email || "";
  if (resource === "brands") description = row.slug || "";
  if (resource === "attributes")
    description = [row.code || row.slug, row.displayType]
      .filter(Boolean)
      .join(" | ");
  if (resource === "product-variants") description = row.sku || "";
  if (resource === "product-media") description = row.alt || "";
  const image =
    row.imageUrl ||
    row.logoUrl ||
    row.image ||
    row.avatarUrl ||
    row.avatar ||
    (resource === "product-media" && row.mediaType === "image"
      ? row.url
      : null);
  return {
    title,
    description: String(description),
    image,
    imageFit: resource === "users" ? "cover" : "contain",
  };
}
export function resourceTableKeys(rows, resource) {
  const primary = tableIdentityKey(resource, rows);
  const consumed = new Set(["description", "summary", "slug"]);
  if (resource === "users") consumed.add("email");
  if (resource === "attributes") {
    consumed.add("code");
    consumed.add("displayType");
  }
  if (resource === "product-variants") consumed.add("sku");
  if (resource === "product-media") {
    consumed.add("url");
    consumed.add("alt");
  }
  // Filter merged fields before applying the column cap, so status remains visible.
  const stripped = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).filter(
        ([key]) =>
          !imageKeys.has(key) &&
          (!primary || !consumed.has(key) || key === primary),
      ),
    ),
  );
  const keys = tableKeys(stripped);
  if (resource === "products")
    return [
      "name",
      "brandId",
      ...keys.filter(
        (key) =>
          !["name", "brandId", "categoryId", "productType"].includes(key),
      ),
    ].slice(0, 7);
  const statuses = ["isActive", "status", "banned"].filter((key) =>
    rows.some((row) => Object.hasOwn(row, key)),
  );
  return primary
    ? [
        primary,
        ...statuses,
        ...keys.filter((key) => key !== primary && !statuses.includes(key)),
      ].slice(0, 7)
    : keys;
}

export function productBrandIdentity(row, labels = {}, brandItems = {}) {
  const types = {
    laptop: "Laptop",
    component: "Linh kiện",
    accessory: "Phụ kiện",
    monitor: "Màn hình",
    furniture: "Nội thất",
    gaming: "Gaming",
    other: "Khác",
  };
  const brand = brandItems[row.brandId];
  return {
    title:
      row.brandName ||
      brand?.label ||
      labels.brands?.[row.brandId] ||
      "Chưa có thương hiệu",
    description: types[row.productType] || row.productType || "—",
    image: brand?.logoUrl || null,
  };
}
