import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { LogIn } from "lucide-react";
import { safeAuthRedirect } from "@/lib/auth/oauth";
import { SocialForm } from "@/components/auth/social-form";
import { Spinner } from "@/components/ui/spinner";
import { AuthFieldError } from "@/components/auth/auth-field-error";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/auth-context";
import {
  clearPendingVerificationEmail,
  setPendingVerificationEmail,
} from "@/lib/auth/pending-verification";
import { signInSchema } from "@/schemas/auth";
export function SignInForm() {
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();
  const search = useRouterState({
    select: (state) => state.location.search,
  });
  const { authenticated, login, user } = useAuth();
  const redirect = safeAuthRedirect(search?.redirect);
  useEffect(() => {
    if (!authenticated) return;
    if (user?.emailVerified) clearPendingVerificationEmail();
    void navigate({
      to: redirect,
      replace: true,
    });
  }, [authenticated, navigate, redirect, user?.emailVerified]);
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
    validators: {
      onChange: signInSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const email = value.email.trim();
        sessionStorage.setItem("two-factor-redirect", redirect);
        const result = await login({
          email,
          password: value.password,
          rememberMe: value.rememberMe,
        });
        if (result?.twoFactorRedirect) return;
        sessionStorage.removeItem("two-factor-redirect");
        if (result?.user?.emailVerified !== false)
          clearPendingVerificationEmail();
        await navigate({
          to: redirect,
          replace: true,
        });
      } catch (cause) {
        if (
          cause instanceof Error &&
          (cause.code === "EMAIL_NOT_VERIFIED" ||
            cause.message === "Email not verified")
        ) {
          const email = value.email.trim();
          setPendingVerificationEmail(email.includes("@") ? email : null);
          await navigate({
            to: "/auth/verify",
            replace: true,
          });
          return;
        }
        setSubmitError(
          cause instanceof Error
            ? cause.message
            : "Không thể đăng nhập. Vui lòng thử lại.",
        );
      }
    },
  });
  return (
    <AuthLayout
      description="Đăng nhập vào tài khoản Webkitlab của bạn."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link
            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
            to="/auth/sign-up"
          >
            Đăng ký
          </Link>
        </>
      }
      title="Đăng nhập"
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
          <form.Field name="email">
            {(field) => (
              <Field
                className="grid gap-2"
                data-invalid={field.state.meta.errors.length > 0}
              >
                <FieldLabel htmlFor={field.name}>
                  Email hoặc username
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  autoComplete="username"
                  placeholder="Email hoặc username"
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
                <div className="flex items-center justify-between gap-4">
                  <FieldLabel htmlFor={field.name}>Mật khẩu</FieldLabel>
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <PasswordInput
                  id={field.name}
                  name={field.name}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <AuthFieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
          <form.Field name="rememberMe">
            {(field) => (
              <Field
                className="flex items-center gap-2"
                orientation="horizontal"
              >
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(Boolean(checked))
                  }
                />
                <FieldLabel htmlFor={field.name} className="font-normal">
                  Ghi nhớ đăng nhập
                </FieldLabel>
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
              signInSchema.safeParse(state.values).success,
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
                  <LogIn data-icon="inline-start" />
                )}
                {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
export const LoginForm = SignInForm;
