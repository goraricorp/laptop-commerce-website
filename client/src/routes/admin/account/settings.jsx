import { createFileRoute } from "@tanstack/react-router";

import AccountPage from "@/pages/account/account-page";

export const Route = createFileRoute("/admin/account/settings")({
  component: AccountPage,
});
