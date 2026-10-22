import { createFileRoute } from "@tanstack/react-router";
import ProductList from "@/pages/overview/product-list";
import { catalogSearchState } from "@/lib/utils/catalog-search";
export const Route = createFileRoute("/_commerce/product/")({
  component: ProductList,
  validateSearch: catalogSearchState,
});
