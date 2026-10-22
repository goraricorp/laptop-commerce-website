import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "../database/index.js";
import {
  attributeValues,
  brands,
  catalogWrites,
  categories,
  inventoryBalances,
  inventoryLocations,
  productContentSections,
  productMedia,
  products,
  productVariants,
  uploadAssets,
  variantAttributeValues,
} from "../database/schema.js";
import { productEditorInput } from "../schemas/product-editor.js";
import { productTypeForCategory } from "../lib/catalog/product-type.js";
import { cleanContent } from "../lib/catalog/content.js";
import { activeOwner, domainError as error } from "./account-state.js";
import { applyStockOperation, inventoryTransaction } from "./stock-ledger.js";
import { attachAssets, queueAssetCleanup } from "./storage.js";
export async function productEditorDetail(id, database = db) {
  const [product] = await database
    .select()
    .from(products)
    .where(eq(products.id, id));
  if (!product) return null;
  product.productType = productTypeForCategory(
    product.categoryId,
    await database.select().from(categories),
  );
  const variants = await database
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.id));
  for (const v of variants)
    v.attributeValueIds = (
      await database
        .select()
        .from(variantAttributeValues)
        .where(eq(variantAttributeValues.variantId, v.id))
    ).map((a) => a.attributeValueId);
  const balances = variants.length
    ? await database
        .select()
        .from(inventoryBalances)
        .where(
          inArray(
            inventoryBalances.variantId,
            variants.map((v) => v.id),
          ),
        )
    : [];
  return {
    product,
    variants,
    media: await database
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, id))
      .orderBy(asc(productMedia.position), asc(productMedia.id)),
    content: await database
      .select()
      .from(productContentSections)
      .where(eq(productContentSections.productId, id))
      .orderBy(
        asc(productContentSections.position),
        asc(productContentSections.id),
      ),
    balances,
  };
}
export async function saveProductEditor(id, raw, actor) {
  if (!["administrator", "master"].includes(actor.role))
    throw error("Không có quyền.", 403);
  const input = productEditorInput.parse(raw);
  const hash = createHash("sha256")
    .update(JSON.stringify({ id, input, actorId: actor.id }))
    .digest("hex");
  const oldUrls = [];
  const result = await inventoryTransaction(async (tx) => {
    await activeOwner(tx, actor.id);
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`product:${id}`},0))`,
    );
    const [oldCommand] = await tx
      .select()
      .from(catalogWrites)
      .where(eq(catalogWrites.id, input.requestId));
    if (oldCommand) {
      if (oldCommand.hash !== hash)
        throw error("Mã lưu đã dùng với nội dung khác.");
      return oldCommand.result;
    }
    const previous = await productEditorDetail(id, tx);
    if (
      previous
        ? previous.product.version !== input.expectedVersion
        : input.expectedVersion !== null
    )
      throw error("Sản phẩm đã được người khác sửa; tải lại trước khi lưu.");
    if (
      input.product.categoryId &&
      !(
        await tx
          .select()
          .from(categories)
          .where(eq(categories.id, input.product.categoryId))
      )[0]
    )
      throw error("Danh mục không hợp lệ.", 400);
    if (
      input.product.brandId &&
      !(
        await tx
          .select()
          .from(brands)
          .where(eq(brands.id, input.product.brandId))
      )[0]
    )
      throw error("Thương hiệu không hợp lệ.", 400);
    const variantIds = input.variants.map((v) => v.id),
      allIds = [
        ...variantIds,
        ...input.media.map((m) => m.id),
        ...input.content.map((c) => c.id),
      ];
    if (new Set(allIds).size !== allIds.length)
      throw error("Trùng mã SKU/nội dung/ảnh.", 400);
    for (const variant of input.variants) {
      const [existing] = await tx
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, variant.id));
      if (existing && existing.productId !== id)
        throw error("SKU thuộc sản phẩm khác.", 400);
      if (
        new Set(variant.attributeValueIds).size !==
        variant.attributeValueIds.length
      )
        throw error("Trùng giá trị thông số.", 400);
      for (const valueId of variant.attributeValueIds)
        if (
          !(
            await tx
              .select()
              .from(attributeValues)
              .where(eq(attributeValues.id, valueId))
          )[0]
        )
          throw error("Giá trị thông số không hợp lệ.", 400);
    }
    if (
      input.media.some((m) => m.variantId && !variantIds.includes(m.variantId))
    )
      throw error("Ảnh tham chiếu SKU ngoài sản phẩm.", 400);
    for (const [table, rows] of [
      [productMedia, input.media],
      [productContentSections, input.content],
    ])
      for (const row of rows) {
        const [existing] = await tx
          .select()
          .from(table)
          .where(eq(table.id, row.id));
        if (existing && existing.productId !== id)
          throw error("Nội dung/ảnh thuộc sản phẩm khác.", 400);
      }
    const urls = [
      ...input.media.map((m) => m.url),
      ...input.content.map((c) => c.imageUrl),
    ].filter(Boolean);
    for (const url of urls) {
      const [asset] = await tx
        .select()
        .from(uploadAssets)
        .where(eq(uploadAssets.url, url))
        .for("update");
      if (asset?.purpose === "support")
        throw error("Không dùng ảnh hỗ trợ riêng tư trong catalog.", 403);
      if (asset?.state === "pending" && asset.userId !== actor.id)
        throw error("Ảnh chưa lưu thuộc người khác.", 403);
    }
    await attachAssets(tx, urls);
    const data = {
      ...input.product,
      version: (previous?.product.version ?? -1) + 1,
      updatedAt: new Date(),
    };
    if (previous)
      await tx.update(products).set(data).where(eq(products.id, id));
    else await tx.insert(products).values({ id, ...data });
    await tx
      .insert(catalogWrites)
      .values({ id: input.requestId, productId: id, actorId: actor.id, hash });
    for (const variant of input.variants) {
      const { attributeValueIds, ...fields } = variant;
      await tx
        .insert(productVariants)
        .values({ ...fields, productId: id })
        .onConflictDoUpdate({
          target: productVariants.id,
          set: { ...fields, updatedAt: new Date() },
        });
      await tx
        .delete(variantAttributeValues)
        .where(eq(variantAttributeValues.variantId, variant.id));
      if (attributeValueIds.length)
        await tx
          .insert(variantAttributeValues)
          .values(
            attributeValueIds.map((attributeValueId) => ({
              variantId: variant.id,
              attributeValueId,
            })),
          );
    }
    for (const old of previous?.variants ?? [])
      if (!variantIds.includes(old.id))
        await tx
          .update(productVariants)
          .set({ status: "discontinued", updatedAt: new Date() })
          .where(eq(productVariants.id, old.id));
    for (const [table, rows] of [
      [productMedia, input.media],
      [productContentSections, input.content],
    ]) {
      const before =
        table === productMedia ? previous?.media : previous?.content;
      oldUrls.push(
        ...(before ?? []).map((r) => r.url ?? r.imageUrl).filter(Boolean),
      );
      await tx.delete(table).where(eq(table.productId, id));
      if (rows.length)
        await tx
          .insert(table)
          .values(
            rows.map((row) => ({
              ...row,
              ...(table === productContentSections
                ? { content: cleanContent(row).content }
                : {}),
              productId: id,
            })),
          );
    }
    const pairs = new Set();
    for (const row of input.inventory) {
      const pair = `${row.locationId}:${row.variantId}`;
      if (pairs.has(pair) || !variantIds.includes(row.variantId))
        throw error("Tồn kho trùng hoặc SKU không thuộc sản phẩm.", 400);
      pairs.add(pair);
      const [location] = await tx
        .select()
        .from(inventoryLocations)
        .where(
          and(
            eq(inventoryLocations.id, row.locationId),
            eq(inventoryLocations.isActive, true),
          ),
        )
        .for("share");
      if (!location) throw error("Kho không hoạt động.", 400);
    }
    if (input.inventory.length)
      await applyStockOperation(tx, {
        key: `product-editor:${input.requestId}`,
        kind: "adjustment",
        actorId: actor.id,
        referenceType: "product",
        referenceId: id,
        note: input.inventory
          .map((r) => `${r.locationId}/${r.variantId}: ${r.reason}`)
          .join("\n"),
        movements: input.inventory.map((row) => ({
          locationId: row.locationId,
          variantId: row.variantId,
          type: "adjustment",
          quantity: row.quantityOnHand - row.expectedOnHand,
          onHandDelta: row.quantityOnHand - row.expectedOnHand,
          reservedDelta: 0,
          expectedOnHand: row.expectedOnHand,
          expectedReserved: row.expectedReserved,
        })),
      });
    for (const row of input.inventory)
      await tx
        .update(inventoryBalances)
        .set({ reorderLevel: row.reorderLevel, updatedAt: new Date() })
        .where(
          and(
            eq(inventoryBalances.locationId, row.locationId),
            eq(inventoryBalances.variantId, row.variantId),
          ),
        );
    const result = await productEditorDetail(id, tx);
    await tx
      .update(catalogWrites)
      .set({ result })
      .where(eq(catalogWrites.id, input.requestId));
    return result;
  }).catch((cause) => {
    if ((cause.cause?.code ?? cause.code) === "23505")
      throw error("Đường dẫn sản phẩm hoặc mã SKU đã được sử dụng.");
    throw cause;
  });
  const kept = [
    ...result.media.map((m) => m.url),
    ...result.content.map((c) => c.imageUrl),
  ];
  await queueAssetCleanup(oldUrls.filter((url) => !kept.includes(url))).catch(
    () => {},
  );
  return result;
}
