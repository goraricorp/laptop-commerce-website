import { createFileRoute } from "@tanstack/react-router";

import Chat from "@/pages/management/chat";

export const Route = createFileRoute("/admin/chat")({ component: Chat });
