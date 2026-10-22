import { createFileRoute } from "@tanstack/react-router";
import NewsletterPage from "@/pages/account/newsletter-page";
export const Route = createFileRoute("/newsletter")({
  component: NewsletterPage,
});
