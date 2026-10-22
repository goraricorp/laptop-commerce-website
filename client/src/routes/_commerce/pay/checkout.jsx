import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_commerce/pay/checkout")({
  beforeLoad: () => {
    throw redirect({ to: "/purchase", replace: true });
  },
});
