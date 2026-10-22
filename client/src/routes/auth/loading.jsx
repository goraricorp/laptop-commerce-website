import { createFileRoute } from "@tanstack/react-router";

import LoadingPage from "@/pages/misc/loading-page";

export const Route = createFileRoute("/auth/loading")({
  component: LoadingPage,
});
