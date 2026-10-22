import { createFileRoute } from "@tanstack/react-router";

import Category from "@/pages/management/category";

export const Route = createFileRoute("/admin/categories")({
  component: Category,
});
