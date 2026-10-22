import { createFileRoute } from "@tanstack/react-router";

import Chatbot from "@/pages/overview/chatbot";

export const Route = createFileRoute("/_commerce/chatbot")({
  component: Chatbot,
});
