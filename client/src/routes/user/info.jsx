import { createFileRoute } from "@tanstack/react-router";

import UserInfoPage from "@/pages/account/user-info-page";

export const Route = createFileRoute("/user/info")({ component: UserInfoPage });
