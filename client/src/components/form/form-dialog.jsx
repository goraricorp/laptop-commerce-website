import PropTypes from "prop-types";
import { RelationPicker } from "./relation-picker";
import { ImageField } from "@/components/upload/image-field";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
function errorMessage(error) {
  if (typeof error === "string") return error;
  return error?.message;
}
export function FormControl({ field, config }) {
  const errors = field.state.meta.errors
    .map((error) => ({
      message: errorMessage(error),
    }))
    .filter((error) => error.message);
  const invalid = field.state.meta.isTouched && errors.length > 0;
  const inputValue =
    config.type === "json" &&
    typeof field.state.value === "object" &&
    field.state.value !== null
      ? JSON.stringify(field.state.value, null, 2)
      : config.type === "datetime-local" && field.state.value
        ? String(field.state.value).slice(0, 16)
        : (field.state.value ?? "");
  const common = {
    id: field.name,
    name: field.name,
    value: inputValue,
    onBlur: field.handleBlur,
    "aria-invalid": invalid,
  };
  return (
    <Field data-invalid={invalid} className={config.className}>
      {config.type !== "relation" && (
        <FieldLabel htmlFor={field.name}>{config.label}</FieldLabel>
      )}
      {config.type === "relation" ? (
        <RelationPicker
          resource={config.resource}
          value={field.state.value ?? null}
          onChange={field.handleChange}
          label={config.label}
          nullable={config.nullable || config.optional}
          invalid={invalid}
        />
      ) : config.type === "readonly" ? (
        <Input {...common} readOnly />
      ) : config.type === "image-upload" ? (
        <ImageField
          field={field}
          label={config.label}
          nullable={config.nullable || config.optional}
        />
      ) : config.type === "checkbox" ? (
        <Field orientation="horizontal">
          <Checkbox
            checked={Boolean(field.state.value)}
            onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
            id={field.name}
            aria-invalid={invalid}
          />
          <FieldLabel htmlFor={field.name}>
            <span>{field.state.value ? "Có" : "Không"}</span>
          </FieldLabel>
        </Field>
      ) : config.type === "textarea" || config.type === "json" ? (
        <Textarea
          {...common}
          rows={config.rows ?? 4}
          placeholder={config.placeholder}
          onChange={(event) => {
            const value = event.target.value;
            if (config.type !== "json") return field.handleChange(value);
            try {
              return field.handleChange(JSON.parse(value));
            } catch {
              return field.handleChange(value);
            }
          }}
        />
      ) : config.type === "select" ? (
        <NativeSelect
          {...common}
          className="w-full"
          onChange={(event) => {
            const value = event.target.value;
            field.handleChange(
              value ||
                (config.nullable ? null : config.optional ? undefined : ""),
            );
          }}
        >
          <NativeSelectOption value="">
            {config.placeholder ?? `Chọn ${config.label.toLowerCase()}`}
          </NativeSelectOption>
          {(config.options ?? []).map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : (
        <Input
          {...common}
          type={config.type ?? "text"}
          min={config.min}
          max={config.max}
          step={config.step}
          placeholder={config.placeholder}
          onChange={(event) => {
            const value = event.target.value;
            if (!value)
              return field.handleChange(
                config.nullable ? null : config.optional ? undefined : "",
              );
            if (config.type === "number")
              return field.handleChange(Number(value));
            if (config.type === "datetime-local")
              return field.handleChange(new Date(value).toISOString());
            return field.handleChange(value);
          }}
        />
      )}
      {invalid && <FieldError errors={errors} />}
    </Field>
  );
}
export function FormDialog({
  form,
  fields,
  title,
  description,
  open,
  onOpenChange,
  error,
  entityId,
  onDelete,
  isDeleting,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <>
      <Dialog open={Boolean(open)} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-6"
          >
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {fields.map((config) => (
                <form.Field key={config.name} name={config.name}>
                  {(field) => <FormControl field={field} config={config} />}
                </form.Field>
              ))}
            </FieldGroup>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <DialogFooter>
                  {entityId && onDelete && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="sm:mr-auto"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Xóa
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                    {isSubmitting ? "Đang lưu…" : "Lưu"}
                  </Button>
                </DialogFooter>
              )}
            </form.Subscribe>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bản ghi này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void onDelete()}
            >
              {isDeleting ? <Spinner className="size-4" /> : null}
              {isDeleting ? "Đang xóa…" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
FormControl.propTypes = {
  field: PropTypes.object,
  config: PropTypes.object,
};
FormDialog.propTypes = {
  form: PropTypes.object,
  fields: PropTypes.array,
  title: PropTypes.node,
  description: PropTypes.node,
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  error: PropTypes.object,
  entityId: PropTypes.string,
  onDelete: PropTypes.func,
  isDeleting: PropTypes.bool,
};
