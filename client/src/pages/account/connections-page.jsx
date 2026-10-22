import { FieldGroup } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { authClient } from "@/lib/auth";
import { caller } from "@/lib/utils/caller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
export default function ConnectionsPage() {
  const { user, session, refresh, accounts, accountsQuery } = useUser({
    loadAccounts: true,
  });
  const config = useQuery({
    queryKey: ["auth", "providers"],
    queryFn: () =>
      caller({
        url: "/auth/providers",
      }),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [verifiedAt, setVerifiedAt] = useState(null);
  const credential = accounts.find((item) => item.providerId === "credential"),
    google = accounts.find((item) => item.providerId === "google");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const recent =
    now - new Date(verifiedAt ?? session?.createdAt).getTime() < 300000;
  async function action(work) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  async function reauthenticate(event) {
    event.preventDefault();
    const form = event.currentTarget,
      password = new FormData(form).get("password");
    await action(async () => {
      const result = await authClient.signIn.email({
        email: user.email,
        password,
        rememberMe: false,
      });
      if (result.error) throw new Error(result.error.message);
      if (result.data?.twoFactorRedirect) return;
      form.reset();
      await refresh();
      setVerifiedAt(result.data?.user ? new Date().toISOString() : null);
      toast.add({
        title: "Đã xác minh lại phiên đăng nhập",
        type: "success",
      });
    });
  }
  const link = () =>
    action(async () => {
      const result = await authClient.linkSocial({
        provider: "google",
        callbackURL: new URL("/settings/connections", window.location.origin)
          .href,
        errorCallbackURL: new URL("/auth/error", window.location.origin).href,
      });
      if (result.error) throw new Error(result.error.message);
    });
  const unlink = () =>
    action(async () => {
      await caller({
        url: "/auth/unlink-account",
        method: "POST",
        body: {
          accountId: google.id,
        },
      });
      await accountsQuery.refetch();
      toast.add({
        title: "Đã gỡ liên kết Google",
        type: "success",
      });
    });
  return (
    <div className="grid max-w-2xl gap-5">
      <h1 className="text-2xl font-semibold">Tài khoản đã kết nối</h1>
      {accountsQuery.isPending ? (
        <div role="status">
          <Skeleton className="h-4 w-32" aria-hidden="true" />
          Đang tải…
        </div>
      ) : accountsQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{accountsQuery.error.message}</AlertDescription>
        </Alert>
      ) : (
        accounts.map((account) => (
          <p key={account.id}>
            {account.providerId === "credential"
              ? "Email và mật khẩu"
              : account.providerId === "google"
                ? "Google"
                : account.providerId}
          </p>
        ))
      )}
      {!user?.emailVerified ? (
        <p>Cần xác minh email tài khoản trước khi liên kết.</p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Link/unlink cần phiên vừa đăng nhập trong 5 phút. Google phải có cùng
        email đã xác minh.
      </p>
      {credential ? (
        <form onSubmit={reauthenticate}>
          <FieldGroup className="flex flex-wrap gap-3">
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              aria-label="Mật khẩu xác minh lại"
              placeholder="Mật khẩu hiện tại"
              required
              className="sm:max-w-sm"
            />
            <Button type="submit" disabled={busy}>
              Xác minh lại
            </Button>
          </FieldGroup>
        </form>
      ) : !recent && google ? (
        <Button
          disabled={busy || !config.data?.google.enabled}
          onClick={() =>
            void action(async () => {
              const result = await authClient.signIn.social({
                provider: "google",
                callbackURL: new URL(
                  "/settings/connections",
                  window.location.origin,
                ).href,
                errorCallbackURL: new URL("/auth/error", window.location.origin)
                  .href,
              });
              if (result.error) throw new Error(result.error.message);
            })
          }
        >
          Xác minh lại với Google
        </Button>
      ) : null}
      {config.isPending ? (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          kiểm tra cấu hình Google…
        </div>
      ) : config.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Không thể tải cấu hình Google.</AlertDescription>
        </Alert>
      ) : !config.data.google.enabled ? (
        <p>Google chưa được cấu hình trên máy chủ.</p>
      ) : !google ? (
        <Button
          disabled={busy || !recent || !user?.emailVerified}
          onClick={() => void link()}
        >
          Liên kết Google
        </Button>
      ) : null}
      {google ? (
        <Button
          variant="outline"
          disabled={busy || !recent || !credential || !user?.emailVerified}
          onClick={() => void unlink()}
        >
          Gỡ liên kết Google
        </Button>
      ) : null}
      {google && !credential ? (
        <p>
          Google là phương thức đăng nhập cuối cùng. Thiết lập mật khẩu qua
          luồng quên mật khẩu trước khi gỡ liên kết.
        </p>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
