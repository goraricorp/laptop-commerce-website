import { createFileRoute } from "@tanstack/react-router";
import { CreateResourceRoute } from "@/pages/management/editor-route";
import { validateResourceSearch } from "@/config/resource-search";
export const Route = createFileRoute("/admin/product/$section/create")({
  component: CreateResourceRoute,
  validateSearch: validateResourceSearch,
});
