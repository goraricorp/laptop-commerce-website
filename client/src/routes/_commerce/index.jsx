import { createFileRoute } from "@tanstack/react-router";

import HomePage from "@/pages/overview/home-page";

export const Route = createFileRoute("/_commerce/")({ component: HomePage });
