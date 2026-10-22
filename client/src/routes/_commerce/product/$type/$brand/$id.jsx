import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailsRoute } from "@/pages/overview/catalog-routes";
export const Route = createFileRoute("/_commerce/product/$type/$brand/$id")({
  component: ProductDetailsRoute,
});
