import { createFileRoute } from "@tanstack/react-router";

import { OrderDetails } from "@/pages/information/order-details";

export const Route = createFileRoute("/user/bill")({ component: OrderDetails });
