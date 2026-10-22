import { dashClient } from "@better-auth/infra/client";
import {
  adminClient,
  emailOTPClient,
  usernameClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { authBaseUrl } from "@/lib/config/api";

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  basePath: "/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.assign("/auth/two-factor");
      },
    }),
    emailOTPClient(),
    usernameClient(),
    adminClient(),
    dashClient(),
  ],
});
