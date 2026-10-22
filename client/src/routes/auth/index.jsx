import { createFileRoute } from "@tanstack/react-router";
import AuthenticationIndex from "@/pages/authentication/authentication-index";
export const Route = createFileRoute("/auth/")({
  component: AuthenticationIndex,
});
