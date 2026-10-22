import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PropTypes from "prop-types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { authClient } from "@/lib/auth";
import { caller } from "@/lib/utils/caller";
import { safeAuthRedirect } from "@/lib/auth/oauth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function SocialForm({ className, ...props }) {
  const config = useQuery({
    queryKey: ["auth", "providers"],
    queryFn: () =>
      caller({
        url: "/auth/providers",
      }),
  });
  const search = useRouterState({
    select: (state) => state.location.search,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function login() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: new URL(
          safeAuthRedirect(search?.redirect),
          window.location.origin,
        ).href,
        errorCallbackURL: new URL("/auth/error", window.location.origin).href,
      });
      if (result.error) throw new Error(result.error.message);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      {config.isPending ? (
        <div role="status">
          <Skeleton className="h-4 w-32" aria-hidden="true" />
          Đang kiểm tra Google…
        </div>
      ) : config.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Không thể kiểm tra cấu hình Google.
          </AlertDescription>
        </Alert>
      ) : config.data.google.enabled ? (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void login()}
        >
          Đăng nhập bằng Google
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Đăng nhập Google chưa được cấu hình trên máy chủ.
        </p>
      )}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
SocialForm.propTypes = {
  className: PropTypes.string,
};
