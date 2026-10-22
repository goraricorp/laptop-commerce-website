import PropTypes from "prop-types";
import { ResourceForm } from "@/components/form/resource-form";
import { catalogSchemas } from "@/schemas/catalog";
import { catalogServices } from "@/services/catalog";
const schemas = {
  campaigns: catalogSchemas.campaign,
  categories: catalogSchemas.category,
  brands: catalogSchemas.brand,
  products: catalogSchemas.product,
  "product-variants": catalogSchemas["product-variant"],
  attributes: catalogSchemas.attribute,
  "attribute-values": catalogSchemas["attribute-value"],
  "variant-attribute-values": catalogSchemas["variant-attribute-value"],
  "product-media": catalogSchemas["product-media"],
  "product-content-sections": catalogSchemas["product-content-section"],
};
export function CatalogForm({
  description = "Quản lý dữ liệu danh mục và sản phẩm.",
  resources,
  title = "Danh mục sản phẩm",
}) {
  return (
    <ResourceForm
      title={title}
      description={description}
      resources={resources}
      schemas={schemas}
      services={catalogServices}
      resourceIds={{
        "variant-attribute-values": (row) =>
          `${row.variantId}:${row.attributeValueId}`,
      }}
    />
  );
}
CatalogForm.propTypes = {
  description: PropTypes.node,
  resources: PropTypes.array,
  title: PropTypes.node,
};
