import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_commerce/pay/order")({
  beforeLoad: () => {
    throw redirect({ to: "/purchase", replace: true });
  },
});
