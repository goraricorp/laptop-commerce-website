import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field";
import { useState, useId } from "react";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";
import { useUser } from "@/hooks/use-user";
import { safeAuthRedirect } from "@/lib/auth/oauth";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default function TwoFactorPage() {
  const fieldIdPrefix = useId();
  const { refresh } = useUser(),
    [backup, setBackup] = useState(false);
  const verify = useMutation({
    mutationFn: async (code) => {
      const r = await (backup
        ? authClient.twoFactor.verifyBackupCode({
            code,
            trustDevice: false,
          })
        : authClient.twoFactor.verifyTotp({
            code,
            trustDevice: false,
          }));
      if (r.error) throw new Error(r.error.message);
      await refresh();
      const next =
        sessionStorage.getItem("two-factor-redirect") ??
        (window.location.pathname === "/auth/two-factor"
          ? "/"
          : window.location.pathname + window.location.search);
      sessionStorage.removeItem("two-factor-redirect");
      window.location.assign(safeAuthRedirect(next));
    },
  });
  return (
    <main className="mx-auto grid max-w-lg gap-5 p-8">
      <h1 className="text-2xl font-semibold">Xác minh hai bước</h1>
      <p>
        Phiên đăng nhập chưa được dùng cho mua hàng hoặc thay đổi tài khoản cho
        đến khi xác minh.
      </p>
      <form
        key={String(backup)}
        onSubmit={(e) => {
          e.preventDefault();
          verify.mutate(new FormData(e.currentTarget).get("code"));
        }}
      >
        <FieldGroup className="grid gap-3">
          <Field>
            <FieldLabel
              htmlFor={[
                fieldIdPrefix,
                "two-factor-page-1583",
                String(backup),
              ].join("-")}
            >
              {backup ? "Mã khôi phục" : "Mã TOTP"}
            </FieldLabel>
            {backup ? (
              <Input
                name="code"
                required
                autoComplete="one-time-code"
                id={[
                  fieldIdPrefix,
                  "two-factor-page-1583",
                  String(backup),
                ].join("-")}
              />
            ) : (
              <InputOTP
                name="code"
                required
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                autoComplete="one-time-code"
                id={[
                  fieldIdPrefix,
                  "two-factor-page-1583",
                  String(backup),
                ].join("-")}
              >
                <InputOTPGroup>
                  {Array.from(
                    {
                      length: 6,
                    },
                    (_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ),
                  )}
                </InputOTPGroup>
              </InputOTP>
            )}
          </Field>
          <Button type="submit" disabled={verify.isPending}>
            Xác minh mã
          </Button>
        </FieldGroup>
      </form>
      <Button variant="outline" onClick={() => setBackup(!backup)}>
        {backup ? "Dùng ứng dụng TOTP" : "Dùng mã khôi phục"}
      </Button>
      <Button
        variant="ghost"
        onClick={async () => {
          await authClient.signOut();
          await refresh();
          window.location.assign("/auth/sign-in");
        }}
      >
        Đăng xuất
      </Button>
      {verify.isError && (
        <Alert variant="destructive">
          <AlertDescription>{verify.error.message}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
