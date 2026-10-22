import { createFileRoute } from "@tanstack/react-router";

import Voucher from "@/pages/management/voucher";

export const Route = createFileRoute("/admin/voucher")({ component: Voucher });
