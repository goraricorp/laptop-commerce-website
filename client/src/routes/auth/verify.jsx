import { createFileRoute } from "@tanstack/react-router";

import OtpPage from "@/pages/authentication/otp-page";

export const Route = createFileRoute("/auth/verify")({ component: OtpPage });
