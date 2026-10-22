import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/hooks/auth-context";
import {
  clearPendingVerificationEmail,
  getPendingVerificationEmail,
} from "@/lib/auth/pending-verification";
import {
  useSendVerificationOtpMutation,
  useVerifyEmailOtpMutation,
} from "@/services/auth";
export function OtpForm() {
  const navigate = useNavigate();
  const { authenticated, user, refresh } = useAuth();
  const [email, setEmail] = useState(getPendingVerificationEmail() ?? "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const verify = useVerifyEmailOtpMutation();
  const resend = useSendVerificationOtpMutation();
  useEffect(() => {
    if (authenticated && user?.emailVerified) {
      clearPendingVerificationEmail();
      void navigate({
        to: "/",
        replace: true,
      });
    }
  }, [authenticated, user?.emailVerified, navigate]);
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await verify.mutateAsync({
        email,
        otp,
      });
      clearPendingVerificationEmail();
      await refresh();
      await navigate({
        to: "/",
        replace: true,
      });
    } catch (cause) {
      setError(cause.message);
    }
  }
  async function sendCode() {
    setError("");
    setMessage("");
    try {
      await resend.mutateAsync({
        email,
        type: "email-verification",
      });
      setOtp("");
      setMessage("Đã yêu cầu gửi mã xác thực. Vui lòng kiểm tra hộp thư.");
    } catch (cause) {
      setError(cause.message);
    }
  }
  return (
    <AuthLayout
      title="Xác thực email"
      description="Nhập mã được gửi đến email của bạn."
      footer={<Link to="/auth/sign-in">Quay lại đăng nhập</Link>}
    >
      <form onSubmit={(event) => void submit(event)}>
        <FieldGroup className="grid gap-4">
          <Field>
            <FieldLabel htmlFor="verification-email">Email</FieldLabel>
            <Input
              id="verification-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="verification-otp">Mã xác thực</FieldLabel>
            <InputOTP
              id="verification-otp"
              autoComplete="one-time-code"
              pattern={REGEXP_ONLY_DIGITS}
              maxLength={6}
              required
              value={otp}
              onChange={setOtp}
              aria-invalid={Boolean(error)}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </Field>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {message ? (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          ) : null}
          <Button disabled={verify.isPending} type="submit">
            {verify.isPending ? "Đang xác thực…" : "Xác thực"}
          </Button>
          <Button
            disabled={!email || resend.isPending}
            type="button"
            variant="outline"
            onClick={() => void sendCode()}
          >
            {resend.isPending ? "Đang gửi…" : "Gửi lại mã"}
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
