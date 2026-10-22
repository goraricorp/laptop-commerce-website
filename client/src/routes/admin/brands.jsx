import { createFileRoute } from "@tanstack/react-router";

import Brands from "@/pages/management/brands";

export const Route = createFileRoute("/admin/brands")({ component: Brands });
