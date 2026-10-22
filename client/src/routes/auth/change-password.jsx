import { createFileRoute } from "@tanstack/react-router";

import ChangePasswordPage from "@/pages/authentication/change-password-page";

export const Route = createFileRoute("/auth/change-password")({
  component: ChangePasswordPage,
});
