import { createFileRoute } from "@tanstack/react-router";

import ProductConfiguration from "@/pages/management/product-configuration";

export const Route = createFileRoute("/admin/product/configuration")({
  component: ProductConfiguration,
});
