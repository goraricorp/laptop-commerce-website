import { createFileRoute } from "@tanstack/react-router";
import { ProductTypeRoute } from "@/pages/overview/catalog-routes";
import { catalogSearchState } from "@/lib/utils/catalog-search";
export const Route = createFileRoute("/_commerce/product/$type/")({
  component: ProductTypeRoute,
  validateSearch: catalogSearchState,
});
