import { createFileRoute } from "@tanstack/react-router";

import NotAuthorizedPage from "@/pages/misc/not-authorized-page";

export const Route = createFileRoute("/auth/not-authorized")({
  component: NotAuthorizedPage,
});
