import { createFileRoute } from "@tanstack/react-router";

import ConnectionsPage from "@/pages/account/connections-page";

export const Route = createFileRoute("/admin/account/connections")({
  component: ConnectionsPage,
});
