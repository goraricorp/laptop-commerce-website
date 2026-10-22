import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
  component: () => <Navigate replace to="/settings/security" />,
});
