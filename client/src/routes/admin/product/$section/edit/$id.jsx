import { createFileRoute } from "@tanstack/react-router";
import { EditResourceRoute } from "@/pages/management/editor-route";
import { validateResourceSearch } from "@/config/resource-search";
export const Route = createFileRoute("/admin/product/$section/edit/$id")({
  component: EditResourceRoute,
  validateSearch: validateResourceSearch,
});
