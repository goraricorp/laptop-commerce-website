import { createFileRoute } from "@tanstack/react-router";

import ConnectionsPage from "@/pages/account/connections-page";

export const Route = createFileRoute("/settings/connections")({
  component: ConnectionsPage,
});
