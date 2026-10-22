import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Send } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AuthFieldError } from "@/components/auth/auth-field-error";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/schemas/auth";
import { useRequestPasswordResetMutation } from "@/services/auth";
export function ForgotPasswordForm() {
  const [submitError, setSubmitError] = useState(null);
  const [sentEmail, setSentEmail] = useState(null);
  const requestReset = useRequestPasswordResetMutation();
  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onChange: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        await requestReset.mutateAsync({
          email: value.email.trim(),
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        setSentEmail(value.email.trim());
      } catch (cause) {
        setSubmitError(
          cause instanceof Error
            ? cause.message
            : "Không thể gửi email đặt lại mật khẩu.",
        );
      }
    },
  });
  if (sentEmail) {
    return (
      <AuthLayout
        footer={
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            to="/auth/sign-in"
          >
            Quay lại đăng nhập
          </Link>
        }
        title="Kiểm tra email"
      >
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Đã gửi hướng dẫn</AlertTitle>
          <AlertDescription>
            Nếu tài khoản <strong>{sentEmail}</strong> tồn tại, bạn sẽ nhận được
            liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư mục thư rác.
          </AlertDescription>
        </Alert>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout
      description="Nhập email để nhận liên kết đặt lại mật khẩu."
      footer={
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          to="/auth/sign-in"
        >
          Quay lại đăng nhập
        </Link>
      }
      title="Quên mật khẩu"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="grid gap-4">
          <form.Field name="email">
            {(field) => (
              <Field
                className="grid gap-2"
                data-invalid={field.state.meta.errors.length > 0}
              >
                <FieldLabel htmlFor={field.name}>Email tài khoản</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="ban@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <AuthFieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          <form.Subscribe
            selector={(state) => [
              forgotPasswordSchema.safeParse(state.values).success,
              state.isSubmitting,
            ]}
          >
            {([isValid, isSubmitting]) => (
              <Button
                className="mt-1 w-full"
                type="submit"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                {isSubmitting ? "Đang gửi…" : "Gửi liên kết đặt lại"}
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
