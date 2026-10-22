import { createFileRoute } from "@tanstack/react-router";

import ErrorPage from "@/pages/misc/error-page";

export const Route = createFileRoute("/auth/error")({ component: ErrorPage });
