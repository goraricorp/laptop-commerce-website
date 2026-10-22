import { createFileRoute } from "@tanstack/react-router";

import Inventory from "@/pages/management/inventory";

export const Route = createFileRoute("/admin/inventory")({
  component: Inventory,
});
