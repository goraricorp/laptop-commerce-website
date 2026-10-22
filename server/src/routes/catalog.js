import { searchInput } from "../schemas/catalog-search.js";
import {
  searchCatalog,
  productDetails,
  activeCampaigns,
  bestSellers,
} from "../services/catalog-search.js";
import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middlewares/admin.js";
import { requireAuth } from "../middlewares/auth.js";
import { clientUrl } from "../lib/utils/environment.js";
import { catalogInput, catalogQuery } from "../schemas/catalog-admin.js";
import { readPublicCatalog } from "../services/public-catalog.js";
import {
  readAdminCatalog,
  writeAdminCatalog,
} from "../services/catalog-admin.js";
const router = Router();
const resources = {
  campaigns: null,
  categories: "/catalog/category",
  brands: "/catalog/brand",
  products: "/product",
  "product-variants": "/product/variant",
  "product-media": "/product/media",
  "product-content-sections": "/product/content",
  attributes: "/attribute",
  "attribute-values": "/attribute/item",
  "variant-attribute-values": "/attribute/variant",
};
const ids = (req, res, resource) =>
  resource === "variant-attribute-values"
    ? {
        variantId: z.uuid().parse(req.params["variantId"]),
        attributeValueId: z.uuid().parse(req.params["attributeValueId"]),
      }
    : {
        id: z.uuid().parse(req.params["id"]),
      };
const send = (req, res, value, status = 200) =>
  value
    ? res.status(status).json(value)
    : res.status(404).json({
        message: "Không tìm thấy bản ghi.",
      });
router.use(
  "/admin/catalog",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
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
  },
);
router.get("/catalog/search", async (req, res) =>
  res.status(200).json(await searchCatalog(searchInput.parse(req.query))),
);
router.get("/catalog/campaigns", async (req, res) =>
  res.status(200).json({
    items: await activeCampaigns(),
  }),
);
router.get("/catalog/spotlight", async (req, res) =>
  res.status(200).json(await bestSellers()),
);
router.get("/product/:id/details", async (req, res) =>
  send(req, res, await productDetails(z.uuid().parse(req.params["id"]))),
);
// Register longer paths before /product/:id and /attribute/:id.
for (const [resource, publicPath] of Object.entries(resources).sort(
  (a, b) => (b[1]?.length ?? 0) - (a[1]?.length ?? 0),
)) {
  const suffix =
    resource === "variant-attribute-values"
      ? "/:variantId/:attributeValueId"
      : "/:id";
  if (publicPath)
    router.get(publicPath, async (req, res) =>
      res
        .status(200)
        .json(await readPublicCatalog(resource, catalogQuery.parse(req.query))),
    );
  if (publicPath)
    router.get(publicPath + suffix, async (req, res) =>
      send(
        req,
        res,
        await readPublicCatalog(
          resource,
          catalogQuery.parse(req.query),
          ids(req, res, resource),
        ),
      ),
    );
  const path = `/admin/catalog/${resource}`;
  router.get(path, async (req, res) =>
    res
      .status(200)
      .json(await readAdminCatalog(resource, catalogQuery.parse(req.query))),
  );
  router.get(path + suffix, async (req, res) =>
    send(
      req,
      res,
      await readAdminCatalog(
        resource,
        catalogQuery.parse(req.query),
        ids(req, res, resource),
      ),
    ),
  );
  const write = (action) => async (req, res) => {
    try {
      const data =
        action === "delete"
          ? {}
          : catalogInput(resource, req["body"], action === "update");
      return send(
        req,
        res,
        await writeAdminCatalog(
          resource,
          action,
          action === "create" ? undefined : ids(req, res, resource),
          data,
        ),
        action === "create" ? 201 : 200,
      );
    } catch (error) {
      if (error.issues)
        return res.status(400).json({
          message: "Validation failed",
          issues: error.issues,
        });
      const code = error.cause?.code ?? error.code;
      if (["23503", "23505"].includes(code))
        return res.status(code === "23505" ? 409 : 400).json({
          message:
            code === "23505"
              ? "Giá trị đã tồn tại."
              : "Quan hệ dữ liệu không hợp lệ hoặc đang được sử dụng.",
          issues: [
            {
              code: "custom",
              path: [],
              message: "Kiểm tra mã, slug và các bản ghi liên quan.",
            },
          ],
        });
      throw error;
    }
  };
  router.post(path, write("create"));
  router.patch(path + suffix, write("update"));
  router.put(path + suffix, write("update"));
  router.delete(path + suffix, write("delete"));
}
export default router;
