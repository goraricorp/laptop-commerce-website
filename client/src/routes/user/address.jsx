import { createFileRoute } from "@tanstack/react-router";

import { AddressManagement } from "@/pages/information/address-management";

export const Route = createFileRoute("/user/address")({
  component: AddressManagement,
});
