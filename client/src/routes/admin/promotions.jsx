import { createFileRoute } from "@tanstack/react-router";

import Promotions from "@/pages/management/promotions";

export const Route = createFileRoute("/admin/promotions")({
  component: Promotions,
});
