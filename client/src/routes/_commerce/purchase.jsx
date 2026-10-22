import { createFileRoute } from "@tanstack/react-router";

import { z } from "zod";
import PurchasePage from "@/pages/payment/purchase-page";

export const Route = createFileRoute("/_commerce/purchase")({
  component: PurchasePage,
  validateSearch: (search) => ({
    orderId: z.uuid().safeParse(search.orderId).success
      ? search.orderId
      : undefined,
  }),
});
