import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_commerce/success")({
  beforeLoad: () => {
    throw redirect({ to: "/purchase", replace: true });
  },
});
