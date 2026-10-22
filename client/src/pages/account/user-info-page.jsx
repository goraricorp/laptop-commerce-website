import {
  Field as FieldRoot,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import PropTypes from "prop-types";
import { AccountDeletion } from "@/components/auth/session-security";
import {
  ImageField,
  ImageDraftProvider,
} from "@/components/upload/image-field";
import { useImageDraft } from "@/hooks/use-image-draft";
import { useEffect, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { Save } from "lucide-react";
import { AccountNavigation } from "@/components/block/account-navigation";
import { Spinner } from "@/components/ui/spinner";
import { AuthFieldError } from "@/components/auth/auth-field-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { useUser } from "@/hooks/use-user";
import { userAccountSchema } from "@/schemas/user-account";
function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
function defaults(user) {
  return {
    username: user?.username ?? "",
    birthday: toDateInput(user?.birthday),
    currentPassword: "",
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    image: user?.image ?? "",
    lastName: user?.lastName ?? "",
    name: user?.name ?? "",
    newPassword: "",
    phone: user?.phone ?? "",
  };
}
function Field({ field, label, type = "text" }) {
  const invalid = field.state.meta.errors.length > 0;
  return (
    <FieldRoot data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        type={type}
        value={field.state.value ?? ""}
        aria-invalid={invalid}
      />
      <AuthFieldError errors={field.state.meta.errors} />
    </FieldRoot>
  );
}
export default function UserInfoPage() {
  const { changeEmail, updateUser, user } = useUser();
  const images = useImageDraft();
  const initialValues = useMemo(() => defaults(user), [user]);
  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onChange: userAccountSchema,
    },
    onSubmit: async ({ value }) => {
      images.beginSave();
      try {
        await updateUser({
          ...(value.username.trim()
            ? {
                username: value.username.trim(),
              }
            : {}),
          birthday: value.birthday
            ? new Date(`${value.birthday}T00:00:00.000Z`)
            : null,
          firstName: value.firstName || null,
          image: value.image || null,
          lastName: value.lastName || null,
          name: value.name.trim(),
          phone: value.phone || null,
        });
        images.saved();
        if (value.email.trim().toLowerCase() !== user.email.toLowerCase())
          await changeEmail({
            callbackURL: new URL("/user/info", window.location.origin).href,
            newEmail: value.email.trim(),
          });
        images.saved();
        form.reset({
          ...value,
          currentPassword: "",
          newPassword: "",
        });
        toast.add({
          description: "Thông tin tài khoản đã được cập nhật.",
          title: "Lưu thành công",
          type: "success",
        });
      } catch (cause) {
        images.endSave();
        const restored = await images.discardAll();
        for (const [name, value] of restored)
          form.setFieldValue(name, value ?? null);
        toast.add({
          description:
            cause instanceof Error
              ? cause.message
              : "Không thể cập nhật tài khoản.",
          title: "Cập nhật thất bại",
          type: "error",
        });
      }
    },
  });
  useEffect(() => {
    if (user) form.reset(defaults(user));
  }, [form, user]);
  if (!user)
    return (
      <div className="grid min-h-64 place-items-center">
        <Spinner className="size-6" />
      </div>
    );
  return (
    <ImageDraftProvider draft={images}>
      <div className="flex flex-col gap-6">
        <AccountNavigation />
        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
            <CardDescription>
              Cập nhật ảnh đại diện và thông tin cá nhân của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <FieldGroup className="flex flex-col gap-6">
                <form.Field name="image">
                  {(field) => <ImageField field={field} label="Ảnh đại diện" />}
                </form.Field>
                <Separator />
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <form.Field name="firstName">
                    {(field) => <Field field={field} label="Tên" />}
                  </form.Field>
                  <form.Field name="lastName">
                    {(field) => <Field field={field} label="Họ" />}
                  </form.Field>
                  <form.Field name="name">
                    {(field) => <Field field={field} label="Tên hiển thị" />}
                  </form.Field>
                  <form.Field name="username">
                    {(field) => <Field field={field} label="Username" />}
                  </form.Field>
                  <form.Field name="email">
                    {(field) => (
                      <Field field={field} label="Email" type="email" />
                    )}
                  </form.Field>
                  <form.Field name="phone">
                    {(field) => (
                      <Field field={field} label="Số điện thoại" type="tel" />
                    )}
                  </form.Field>
                  <form.Field name="birthday">
                    {(field) => (
                      <Field field={field} label="Ngày sinh" type="date" />
                    )}
                  </form.Field>
                </FieldGroup>
                <div className="flex flex-wrap gap-2">
                  <form.Subscribe
                    selector={(state) => [
                      state.isDirty,
                      state.isSubmitting,
                      state.canSubmit,
                    ]}
                  >
                    {([dirty, submitting, canSubmit]) => (
                      <Button
                        disabled={
                          !dirty || submitting || !canSubmit || images.busy
                        }
                        type="submit"
                      >
                        {submitting ? (
                          <Spinner data-icon="inline-start" />
                        ) : (
                          <Save data-icon="inline-start" />
                        )}
                        {submitting ? "Đang lưu…" : "Lưu thay đổi"}
                      </Button>
                    )}
                  </form.Subscribe>
                  <form.Subscribe selector={(state) => state.isDirty}>
                    {(dirty) => (
                      <Button
                        disabled={!dirty}
                        onClick={async () => {
                          await images.discardAll();
                          form.reset(defaults(user));
                        }}
                        type="button"
                        variant="secondary"
                      >
                        Hủy thay đổi
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <AccountDeletion />
      </div>
    </ImageDraftProvider>
  );
}
Field.propTypes = {
  field: PropTypes.object,
  label: PropTypes.node,
  type: PropTypes.string,
};
