import { createFileRoute } from "@tanstack/react-router";

import ProductColor from "@/pages/management/product-color";

export const Route = createFileRoute("/admin/product/color")({
  component: ProductColor,
});
