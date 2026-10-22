import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_commerce/pay/cart")({
  beforeLoad: () => {
    throw redirect({ to: "/cart", replace: true });
  },
});
