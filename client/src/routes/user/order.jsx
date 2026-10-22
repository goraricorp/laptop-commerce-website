import { createFileRoute } from "@tanstack/react-router";

import { OrderHistory } from "@/pages/information/order-history";

export const Route = createFileRoute("/user/order")({
  component: OrderHistory,
});
