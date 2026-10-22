import { createFileRoute } from "@tanstack/react-router";

import AboutPage from "@/pages/overview/about-page";

export const Route = createFileRoute("/_commerce/about")({
  component: AboutPage,
});
