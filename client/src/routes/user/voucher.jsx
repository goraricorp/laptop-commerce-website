import { createFileRoute } from "@tanstack/react-router";

import { VoucherWallet } from "@/pages/information/voucher-wallet";

export const Route = createFileRoute("/user/voucher")({
  component: VoucherWallet,
});
