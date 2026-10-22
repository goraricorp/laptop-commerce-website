import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useId } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { caller } from "@/lib/utils/caller";
import { RelationPicker } from "@/components/form/relation-picker";
async function unwrap(promise) {
  const r = await promise;
  if (r.error) throw new Error(r.error.message);
  return r.data;
}
export function Reauthentication() {
  const fieldIdPrefix = useId();
  const providers = useQuery({
    queryKey: ["auth", "providers"],
    queryFn: () =>
      caller({
        url: "/auth/providers",
      }),
  });
  const { user, refresh, accounts, accountsQuery } = useUser({
    loadAccounts: true,
  });
  const mutation = useMutation({
    mutationFn: async (fd) => {
      if (fd.has("password"))
        await unwrap(
          authClient.verifyPassword({
            password: fd.get("password"),
          }),
        );
      if (fd.get("code"))
        await unwrap(
          authClient.twoFactor.verifyTotp({
            code: fd.get("code"),
            trustDevice: false,
          }),
        );
      await refresh();
    },
    onSuccess: () =>
      toast.add({
        title: "Đã xác minh lại phiên đăng nhập",
        type: "success",
      }),
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  return (
    <section className="grid gap-3 rounded border p-4">
      <h2 className="font-semibold">Xác minh trước thao tác nhạy cảm</h2>
      <p>Xác minh đăng nhập và mã hai bước trong 5 phút gần nhất.</p>
      {accountsQuery.isPending ? (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          kiểm tra phương thức đăng nhập…
        </div>
      ) : accountsQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{accountsQuery.error.message}</AlertDescription>
        </Alert>
      ) : accounts.some((a) => a.providerId === "credential") ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(new FormData(e.currentTarget));
          }}
        >
          <FieldGroup className="grid gap-3">
            <Field>
              <FieldLabel
                htmlFor={[fieldIdPrefix, "session-security-2157"].join("-")}
              >
                Mật khẩu xác minh lại
              </FieldLabel>
              <Input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                id={[fieldIdPrefix, "session-security-2157"].join("-")}
              />
            </Field>
            {user?.twoFactorEnabled && (
              <Field>
                <FieldLabel
                  htmlFor={[fieldIdPrefix, "session-security-2432"].join("-")}
                >
                  Mã TOTP xác minh lại
                </FieldLabel>
                <Input
                  name="code"
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  id={[fieldIdPrefix, "session-security-2432"].join("-")}
                />
              </Field>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              Xác minh lại đăng nhập
            </Button>
          </FieldGroup>
        </form>
      ) : (
        <Button
          disabled={!providers.data?.google.enabled}
          onClick={async () => {
            try {
              await unwrap(
                authClient.signIn.social({
                  provider: "google",
                  callbackURL: window.location.href,
                  errorCallbackURL: new URL(
                    "/auth/error",
                    window.location.origin,
                  ).href,
                }),
              );
            } catch (e) {
              toast.add({
                title: e.message,
                type: "error",
              });
            }
          }}
        >
          {providers.data?.google.enabled
            ? "Xác minh lại bằng Google"
            : "Google chưa được cấu hình"}
        </Button>
      )}
      {mutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
export function TwoFactorSettings() {
  const fieldIdPrefix = useId();
  const { user, refresh } = useUser(),
    [setup, setSetup] = useState(null),
    [backup, setBackup] = useState([]);
  const mutation = useMutation({
    mutationFn: async ({ action, fd }) => {
      if (action === "enable") {
        const result = await unwrap(
          authClient.twoFactor.enable({
            password: fd.get("password") || undefined,
            method: "totp",
          }),
        );
        setSetup(result.totpURI);
        setBackup(result.backupCodes);
      } else if (action === "verify") {
        await unwrap(
          authClient.twoFactor.verifyTotp({
            code: fd.get("code"),
            trustDevice: false,
          }),
        );
        setSetup(null);
      } else if (action === "disable") {
        await unwrap(
          authClient.twoFactor.disable({
            password: fd.get("password") || undefined,
          }),
        );
        setBackup([]);
        setSetup(null);
      } else {
        const result = await unwrap(
          authClient.twoFactor.generateBackupCodes({
            password: fd.get("password") || undefined,
          }),
        );
        setBackup(result.backupCodes);
      }
      await refresh();
    },
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
    onSuccess: () =>
      toast.add({
        title: "Đã cập nhật xác thực hai bước",
        type: "success",
      }),
  });
  const form = (action, title) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({
          action,
          fd: new FormData(e.currentTarget),
        });
      }}
    >
      <FieldGroup className="grid gap-2">
        <Field>
          <FieldLabel
            htmlFor={[fieldIdPrefix, "session-security-5465"].join("-")}
          >
            Mật khẩu (nếu có tài khoản mật khẩu)
          </FieldLabel>
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            id={[fieldIdPrefix, "session-security-5465"].join("-")}
          />
        </Field>
        <Button type="submit" disabled={mutation.isPending}>
          {title}
        </Button>
      </FieldGroup>
    </form>
  );
  return (
    <section className="grid gap-4 rounded border p-4">
      <h2 className="text-xl font-semibold">Xác thực hai bước</h2>
      <p>
        {user?.twoFactorEnabled
          ? "Đang bật TOTP cho tài khoản."
          : "Chưa bật; chỉ có hiệu lực sau khi xác minh mã trong ứng dụng."}
      </p>
      {!user?.twoFactorEnabled && !setup && form("enable", "Thiết lập TOTP")}
      {setup && (
        <>
          <p>
            Nhập khóa thiết lập dưới đây vào ứng dụng xác thực. Giữ riêng khóa
            này.
          </p>
          <FieldLabel>
            Mã thiết lập thủ công
            <code className="block break-all rounded bg-muted p-3">
              {new URL(setup).searchParams.get("secret")}
            </code>
          </FieldLabel>
          <p>
            Tài khoản: {user.email}; nhà phát hành: Laptop Commerce; TOTP 6 số,
            đổi mỗi 30 giây.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({
                action: "verify",
                fd: new FormData(e.currentTarget),
              });
            }}
          >
            <FieldGroup className="grid gap-2">
              <Field>
                <FieldLabel
                  htmlFor={[fieldIdPrefix, "session-security-6945"].join("-")}
                >
                  Mã từ ứng dụng
                </FieldLabel>
                <Input
                  name="code"
                  required
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  id={[fieldIdPrefix, "session-security-6945"].join("-")}
                />
              </Field>
              <Button type="submit" disabled={mutation.isPending}>
                Xác nhận bật hai bước
              </Button>
            </FieldGroup>
          </form>
        </>
      )}
      {user?.twoFactorEnabled && (
        <>
          {form("backup", "Tạo lại mã khôi phục")}
          {form("disable", "Tắt xác thực hai bước")}
        </>
      )}
      {backup.length > 0 && (
        <div className="grid gap-2">
          <h3 className="font-semibold">
            Lưu mã khôi phục — mỗi mã dùng một lần
          </h3>
          <p>
            Các mã mới thay thế toàn bộ mã cũ. Chỉ hiển thị trong trang này,
            không lưu vào trình duyệt.
          </p>
          <pre className="rounded border p-3">{backup.join("\n")}</pre>
          <Button variant="outline" onClick={() => setBackup([])}>
            Đã lưu mã, ẩn khỏi trang
          </Button>
        </div>
      )}
      {mutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
export function AccountDeletion() {
  const fieldIdPrefix = useId();
  const { user, refresh } = useUser(),
    [confirmed, setConfirmed] = useState(false),
    [successor, setSuccessor] = useState(null);
  const mutation = useMutation({
    mutationFn: (body) =>
      caller({
        url: "/me/account/delete",
        method: "POST",
        body,
      }),
    onSuccess: async () => {
      await refresh();
      window.location.assign("/auth/sign-in");
    },
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  const transfer = useMutation({
    mutationFn: () =>
      caller({
        url: "/me/account/transfer-master",
        method: "POST",
        body: {
          successorId: successor,
        },
      }),
    onSuccess: async () => {
      await refresh();
      toast.add({
        title: "Đã bàn giao master; người nhận phải đăng nhập lại",
        type: "success",
      });
    },
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  return (
    <section className="grid gap-4 rounded border border-destructive/40 p-4">
      <h2 className="text-xl font-semibold">Xóa tài khoản</h2>
      <p>
        Tài khoản sẽ được ẩn danh và thu hồi phiên/liên kết đăng nhập. Chứng từ
        giao dịch vẫn được giữ. Cần hoàn tất đơn, trả hàng và hoàn tiền đang mở
        trước khi xóa.
      </p>
      <Reauthentication />
      {user?.role === "master" && (
        <div className="grid gap-3">
          <p>
            Bàn giao master cho quản trị viên đã xác minh email trước khi xóa.
          </p>
          <RelationPicker
            resource="users"
            filters={{
              masterEligible: "true",
              excludeId: user.id,
            }}
            value={successor}
            onChange={setSuccessor}
            label="Người nhận master"
          />
          <Button
            disabled={!successor || transfer.isPending}
            onClick={() => transfer.mutate()}
          >
            Bàn giao master
          </Button>
          {transfer.isError && (
            <Alert variant="destructive">
              <AlertDescription>{transfer.error.message}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({
            confirmEmail: new FormData(e.currentTarget).get("confirmEmail"),
          });
        }}
      >
        <FieldGroup className="grid gap-3">
          <Field>
            <FieldLabel
              htmlFor={[fieldIdPrefix, "session-security-10581"].join("-")}
            >
              Nhập email tài khoản để xác nhận
            </FieldLabel>
            <Input
              name="confirmEmail"
              type="email"
              required
              id={[fieldIdPrefix, "session-security-10581"].join("-")}
            />
          </Field>
          <Field orientation="horizontal">
            <Checkbox
              required
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked)}
              id={[fieldIdPrefix, "session-security-10719"].join("-")}
            />
            <FieldLabel
              htmlFor={[fieldIdPrefix, "session-security-10719"].join("-")}
            >
              {" "}
              Tôi hiểu tài khoản không thể đăng nhập lại sau khi xóa.
            </FieldLabel>
          </Field>
          <Button
            type="submit"
            variant="destructive"
            disabled={
              !confirmed || mutation.isPending || user?.role === "master"
            }
          >
            Xóa và ẩn danh tài khoản
          </Button>
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>{mutation.error.message}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </form>
    </section>
  );
}
