import { createFileRoute } from "@tanstack/react-router";

import ForgotPasswordPage from "@/pages/authentication/forgot-password-page";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});
