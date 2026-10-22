import { createFileRoute } from "@tanstack/react-router";

import WaitingPage from "@/pages/misc/waiting-page";

export const Route = createFileRoute("/auth/waiting")({
  component: WaitingPage,
});
