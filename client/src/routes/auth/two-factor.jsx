import { createFileRoute } from "@tanstack/react-router";
import TwoFactorPage from "@/pages/authentication/two-factor-page";
export const Route = createFileRoute("/auth/two-factor")({
  component: TwoFactorPage,
});
