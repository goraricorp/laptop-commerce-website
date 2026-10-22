import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { SocialForm } from "@/components/auth/social-form";
import { Spinner } from "@/components/ui/spinner";
import { AuthFieldError } from "@/components/auth/auth-field-error";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/auth-context";
import { setPendingVerificationEmail } from "@/lib/auth/pending-verification";
import { signUpSchema } from "@/schemas/auth";
export function SignUpForm() {
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();
  const { register } = useAuth();
  const form = useForm({
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const email = value.email.trim();
        await register({
          name: value.name.trim(),
          username: value.username.trim(),
          callbackURL: new URL("/", window.location.origin).href,
          email,
          password: value.password,
        });
        setPendingVerificationEmail(email);
        await navigate({
          to: "/auth/verify",
          replace: true,
        });
      } catch (cause) {
        setSubmitError(
          cause instanceof Error
            ? cause.message
            : "Không thể tạo tài khoản. Vui lòng thử lại.",
        );
      }
    },
  });
  return (
    <AuthLayout
      description="Đăng ký tài khoản Webkitlab bằng email của bạn."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
            to="/auth/sign-in"
          >
            Đăng nhập
          </Link>
        </>
      }
      title="Tạo tài khoản"
    >
      <SocialForm />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="grid gap-4">
          <form.Field name="name">
            {(field) => (
              <Field
                className="grid gap-2"
                data-invalid={field.state.meta.errors.length > 0}
              >
                <FieldLabel htmlFor={field.name}>Họ và tên</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <AuthFieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
          <form.Field name="username">
            {(field) => (
              <Field
                className="grid gap-2"
                data-invalid={field.state.meta.errors.length > 0}
              >
                <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="username"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <AuthFieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => (
              <Field
                className="grid gap-2"
                data-invalid={field.state.meta.errors.length > 0}
              >
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
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
          <form.Field name="password">
            {(field) => (
              <Field
                className="grid gap-2"
                data-invalid={field.state.meta.errors.length > 0}
              >
                <FieldLabel htmlFor={field.name}>Mật khẩu</FieldLabel>
                <PasswordInput
                  id={field.name}
                  name={field.name}
                  autoComplete="new-password"
                  placeholder="Ít nhất 8 ký tự"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <AuthFieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
          <form.Field name="confirmPassword">
            {(field) => (
              <Field
                className="grid gap-2"
                data-invalid={field.state.meta.errors.length > 0}
              >
                <FieldLabel htmlFor={field.name}>Xác nhận mật khẩu</FieldLabel>
                <PasswordInput
                  id={field.name}
                  name={field.name}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
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
              signUpSchema.safeParse(state.values).success,
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
                  <UserPlus data-icon="inline-start" />
                )}
                {isSubmitting ? "Đang tạo tài khoản…" : "Đăng ký"}
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
