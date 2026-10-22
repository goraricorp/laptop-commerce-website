import { createFileRoute } from "@tanstack/react-router";

import ContactPage from "@/pages/overview/contact-page";

export const Route = createFileRoute("/_commerce/contact")({
  component: ContactPage,
});
