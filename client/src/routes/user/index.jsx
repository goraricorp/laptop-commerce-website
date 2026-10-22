import { createFileRoute } from "@tanstack/react-router";

import PreviewPage from "@/pages/dashboard/preview-page";

export const Route = createFileRoute("/user/")({ component: PreviewPage });
