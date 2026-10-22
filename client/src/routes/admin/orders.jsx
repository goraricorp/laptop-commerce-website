import { createFileRoute } from "@tanstack/react-router";

import Orders from "@/pages/management/orders";

export const Route = createFileRoute("/admin/orders")({ component: Orders });
