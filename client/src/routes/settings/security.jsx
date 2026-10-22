import { createFileRoute } from "@tanstack/react-router";

import SecurityPage from "@/pages/account/security-page";

export const Route = createFileRoute("/settings/security")({
  component: SecurityPage,
});
