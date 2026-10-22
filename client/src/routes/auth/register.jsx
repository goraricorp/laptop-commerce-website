import { createFileRoute } from "@tanstack/react-router";

import RegisterPage from "@/pages/authentication/register-page";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});
