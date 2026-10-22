import { createFileRoute } from "@tanstack/react-router";

import LoginPage from "@/pages/authentication/login-page";

export const Route = createFileRoute("/auth/login")({ component: LoginPage });
