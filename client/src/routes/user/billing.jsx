import { createFileRoute } from "@tanstack/react-router";

import BillingPage from "@/pages/account/billing-page";

export const Route = createFileRoute("/user/billing")({
  component: BillingPage,
});
