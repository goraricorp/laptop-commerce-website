import { createFileRoute } from "@tanstack/react-router";

import NotificationPage from "@/pages/account/notification-page";

export const Route = createFileRoute("/admin/account/notifications")({
  component: NotificationPage,
});
