import { createFileRoute } from "@tanstack/react-router";

import Attributes from "@/pages/management/attributes";

export const Route = createFileRoute("/admin/attributes")({
  component: Attributes,
});
