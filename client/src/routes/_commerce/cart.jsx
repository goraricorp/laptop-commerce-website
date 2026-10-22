import { createFileRoute } from "@tanstack/react-router";

import CartList from "@/pages/payment/cart-list";

export const Route = createFileRoute("/_commerce/cart")({
  component: CartList,
});
