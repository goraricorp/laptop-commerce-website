import { createFileRoute } from "@tanstack/react-router";

import Reviews from "@/pages/management/reviews";

export const Route = createFileRoute("/admin/reviews")({ component: Reviews });
