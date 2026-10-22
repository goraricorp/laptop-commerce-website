import { createFileRoute } from "@tanstack/react-router";

import UserDemoPage from "@/pages/account/user-demo-page";

export const Route = createFileRoute("/user/demo")({ component: UserDemoPage });
