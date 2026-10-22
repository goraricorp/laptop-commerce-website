import { FieldGroup, Field } from "@/components/ui/field";
import {
  Reauthentication,
  TwoFactorSettings,
} from "@/components/auth/session-security";
import { useForm } from "@tanstack/react-form";
import { KeyRound } from "lucide-react";
import { AccountNavigation } from "@/components/block/account-navigation";
import { AuthFieldError } from "@/components/auth/auth-field-error";
import { PasswordInput } from "@/components/auth/password-input";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { useUser } from "@/hooks/use-user";
import { changePasswordSchema } from "@/schemas/auth";
export default function SecurityPage() {
  const { changePassword } = useUser();
  const form = useForm({
    defaultValues: {
      confirmPassword: "",
      currentPassword: "",
      newPassword: "",
    },
    validators: {
      onChange: changePasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });
        form.reset();
        toast.add({
          title: "Đổi mật khẩu thành công",
          description: "Mật khẩu mới đã có hiệu lực.",
          type: "success",
        });
      } catch (cause) {
        toast.add({
          title: "Không thể đổi mật khẩu",
          description:
            cause instanceof Error ? cause.message : "Vui lòng thử lại.",
          type: "error",
        });
      }
    },
  });
  return (
    <div className="flex flex-col gap-6">
      <AccountNavigation />
      <Reauthentication />
      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>
            Sử dụng mật khẩu mạnh và không dùng lại ở dịch vụ khác.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <form.Field name="currentPassword">
                {(field) => (
                  <Field
                    className="flex flex-col gap-2 md:col-span-2"
                    data-invalid={field.state.meta.errors.length > 0}
                  >
                    <Label htmlFor={field.name}>Mật khẩu hiện tại</Label>
                    <PasswordInput
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    <AuthFieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
              <form.Field name="newPassword">
                {(field) => (
                  <Field
                    className="flex flex-col gap-2"
                    data-invalid={field.state.meta.errors.length > 0}
                  >
                    <Label htmlFor={field.name}>Mật khẩu mới</Label>
                    <PasswordInput
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    <AuthFieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
              <form.Field name="confirmPassword">
                {(field) => (
                  <Field
                    className="flex flex-col gap-2"
                    data-invalid={field.state.meta.errors.length > 0}
                  >
                    <Label htmlFor={field.name}>Xác nhận mật khẩu mới</Label>
                    <PasswordInput
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    <AuthFieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
              <div className="flex gap-2 md:col-span-2">
                <form.Subscribe
                  selector={(state) => [
                    state.isDirty,
                    state.isSubmitting,
                    state.canSubmit,
                  ]}
                >
                  {([dirty, submitting, canSubmit]) => (
                    <Button
                      type="submit"
                      disabled={!dirty || submitting || !canSubmit}
                    >
                      {submitting ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <KeyRound data-icon="inline-start" />
                      )}
                      Lưu thay đổi
                    </Button>
                  )}
                </form.Subscribe>
                <Button
                  onClick={() => form.reset()}
                  type="button"
                  variant="secondary"
                >
                  Đặt lại
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <TwoFactorSettings />
    </div>
  );
}
