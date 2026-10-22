import { FieldGroup, FieldLabel, Field } from "@/components/ui/field";
import PropTypes from "prop-types";
import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { KeyRound } from "lucide-react";
import { AuthFieldError } from "@/components/auth/auth-field-error";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth-context";
import { changePasswordSchema, resetPasswordSchema } from "@/schemas/auth";
import {
  useChangePasswordMutation,
  useResetPasswordMutation,
} from "@/services/auth";
function PasswordFields({
  form,
  firstName = "password",
  firstLabel = "Mật khẩu mới",
}) {
  return (
    <>
      <form.Field name={firstName}>
        {(field) => (
          <Field
            className="grid gap-2"
            data-invalid={field.state.meta.errors.length > 0}
          >
            <FieldLabel htmlFor={field.name}>{firstLabel}</FieldLabel>
            <PasswordInput
              id={field.name}
              name={field.name}
              autoComplete={
                firstName === "currentPassword"
                  ? "current-password"
                  : "new-password"
              }
              placeholder={
                firstName === "currentPassword"
                  ? "Nhập mật khẩu hiện tại"
                  : "Ít nhất 8 ký tự"
              }
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <AuthFieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>
      {firstName === "currentPassword" ? (
        <form.Field name="newPassword">
          {(field) => (
            <Field
              className="grid gap-2"
              data-invalid={field.state.meta.errors.length > 0}
            >
              <FieldLabel htmlFor={field.name}>Mật khẩu mới</FieldLabel>
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
      ) : null}
      <form.Field name="confirmPassword">
        {(field) => (
          <Field
            className="grid gap-2"
            data-invalid={field.state.meta.errors.length > 0}
          >
            <FieldLabel htmlFor={field.name}>Xác nhận mật khẩu mới</FieldLabel>
            <PasswordInput
              id={field.name}
              name={field.name}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu mới"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <AuthFieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>
    </>
  );
}
export function ResetPasswordForm() {
  const [submitError, setSubmitError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const search = useRouterState({
    select: (state) => state.location.search,
  });
  const resetPassword = useResetPasswordMutation();
  const token = typeof search?.token === "string" ? search.token : "";
  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      if (!token)
        return setSubmitError(
          "Liên kết đặt lại mật khẩu thiếu token hoặc không hợp lệ.",
        );
      try {
        await resetPassword.mutateAsync({
          newPassword: value.password,
          token,
        });
        setCompleted(true);
      } catch (cause) {
        setSubmitError(
          cause instanceof Error
            ? cause.message
            : "Không thể đặt lại mật khẩu.",
        );
      }
    },
  });
  if (completed) {
    return (
      <AuthLayout title="Đặt lại mật khẩu thành công">
        <Alert>
          <KeyRound className="size-4" />
          <AlertTitle>Đã đổi mật khẩu</AlertTitle>
          <AlertDescription>
            Bạn có thể{" "}
            <Link to="/auth/sign-in" className="font-medium text-foreground">
              đăng nhập bằng mật khẩu mới
            </Link>
            .
          </AlertDescription>
        </Alert>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout
      description="Chọn mật khẩu mới cho tài khoản của bạn."
      title="Đặt lại mật khẩu"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="grid gap-4">
          <PasswordFields form={form} />
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          <form.Subscribe
            selector={(state) => [
              resetPasswordSchema.safeParse(state.values).success,
              state.isSubmitting,
            ]}
          >
            {([isValid, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!isValid || isSubmitting || !token}
              >
                {isSubmitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <KeyRound data-icon="inline-start" />
                )}
                {isSubmitting ? "Đang lưu…" : "Lưu mật khẩu mới"}
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
export function ChangePasswordForm() {
  const [submitError, setSubmitError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();
  const { authenticated, isLoading } = useAuth();
  const changePassword = useChangePasswordMutation();
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onChange: changePasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        await changePassword.mutateAsync({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: true,
        });
        setCompleted(true);
        form.reset();
      } catch (cause) {
        setSubmitError(
          cause instanceof Error ? cause.message : "Không thể đổi mật khẩu.",
        );
      }
    },
  });
  if (completed) {
    return (
      <AuthLayout title="Đổi mật khẩu thành công">
        <Alert>
          <KeyRound className="size-4" />
          <AlertTitle>Đã đổi mật khẩu</AlertTitle>
          <AlertDescription>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() =>
                void navigate({
                  to: "/",
                })
              }
            >
              Trở về trang chủ
            </Button>
          </AlertDescription>
        </Alert>
      </AuthLayout>
    );
  }
  if (isLoading) {
    return (
      <AuthLayout title="Đổi mật khẩu">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Đang kiểm tra phiên đăng nhập…
        </div>
      </AuthLayout>
    );
  }
  if (!authenticated) {
    return (
      <AuthLayout
        description="Bạn cần đăng nhập trước khi thay đổi mật khẩu."
        title="Đổi mật khẩu"
      >
        <Button
          className="w-full"
          render={
            <Link
              search={{
                redirect: "/auth/change-password",
              }}
              to="/auth/sign-in"
            />
          }
        >
          Đăng nhập để tiếp tục
        </Button>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout
      description="Cập nhật mật khẩu đang bảo vệ tài khoản của bạn."
      title="Đổi mật khẩu"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="grid gap-4">
          <PasswordFields
            form={form}
            firstName="currentPassword"
            firstLabel="Mật khẩu hiện tại"
          />
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          <form.Subscribe
            selector={(state) => [
              changePasswordSchema.safeParse(state.values).success,
              state.isSubmitting,
            ]}
          >
            {([isValid, isSubmitting]) => (
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <KeyRound data-icon="inline-start" />
                )}
                {isSubmitting ? "Đang cập nhật…" : "Đổi mật khẩu"}
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
export const UpdatePasswordForm = ResetPasswordForm;
PasswordFields.propTypes = {
  form: PropTypes.object,
  firstName: PropTypes.string,
  firstLabel: PropTypes.string,
};
