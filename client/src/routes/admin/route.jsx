import { createFileRoute } from "@tanstack/react-router";

import Layout from "@/layouts/layout";

export const Route = createFileRoute("/admin")({ component: Layout });
