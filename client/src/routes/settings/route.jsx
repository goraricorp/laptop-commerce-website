import { createFileRoute } from "@tanstack/react-router";

import SettingsLayout from "@/layouts/settings";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});
