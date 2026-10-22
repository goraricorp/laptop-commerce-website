import { createFileRoute } from "@tanstack/react-router";

import MaintenancePage from "@/pages/misc/maintenance-page";

export const Route = createFileRoute("/auth/maintenance")({
  component: MaintenancePage,
});
