import { createFileRoute } from "@tanstack/react-router";

import Statistics from "@/pages/management/statistics";

export const Route = createFileRoute("/admin/statistics")({
  component: Statistics,
});
