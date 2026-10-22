import { createFileRoute } from "@tanstack/react-router";

import ComingPage from "@/pages/misc/coming-page";

export const Route = createFileRoute("/auth/coming")({ component: ComingPage });
