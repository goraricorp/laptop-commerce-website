import { createFileRoute } from "@tanstack/react-router";

import Panel from "@/layouts/panel";

export const Route = createFileRoute("/user")({ component: Panel });
