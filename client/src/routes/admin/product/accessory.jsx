import { createFileRoute } from "@tanstack/react-router";

import ProductAccessory from "@/pages/management/product-accessory";

export const Route = createFileRoute("/admin/product/accessory")({
  component: ProductAccessory,
});
