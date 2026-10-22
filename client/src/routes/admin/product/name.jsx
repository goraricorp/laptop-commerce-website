import { createFileRoute } from "@tanstack/react-router";

import ProductName from "@/pages/management/product-name";

export const Route = createFileRoute("/admin/product/name")({
  component: ProductName,
});
