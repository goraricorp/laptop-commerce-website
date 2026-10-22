import { createFileRoute } from "@tanstack/react-router";

import UserManagement from "@/pages/management/user-management";

export const Route = createFileRoute("/admin/users")({
  component: UserManagement,
});
