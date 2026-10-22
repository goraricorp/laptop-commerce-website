import { createFileRoute } from "@tanstack/react-router";

import Products from "@/pages/management/products";

export const Route = createFileRoute("/admin/products")({
  component: Products,
});
