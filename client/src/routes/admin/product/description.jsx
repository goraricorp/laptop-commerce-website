import { createFileRoute } from "@tanstack/react-router";

import ProductDescription from "@/pages/management/product-description";

export const Route = createFileRoute("/admin/product/description")({
  component: ProductDescription,
});
