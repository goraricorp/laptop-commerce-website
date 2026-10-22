import { createFileRoute } from "@tanstack/react-router";

import DemoPage from "@/pages/overview/demo";

export const Route = createFileRoute("/_commerce/demo")({
  component: DemoPage,
});
