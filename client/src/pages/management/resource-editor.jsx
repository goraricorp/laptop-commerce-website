import PropTypes from "prop-types";
import { Reauthentication } from "@/components/auth/session-security";
import ProductEditor from "./product-editor";
import { ImageDraftProvider } from "@/components/upload/image-field";
import { useImageDraft } from "@/hooks/use-image-draft";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { FormControl } from "@/components/form/form-dialog";
import { useEntityForm } from "@/hooks/use-entity-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import {
  adminResources,
  defaultResourceBySection,
} from "@/config/admin-resources";
import {
  buildResourceFields,
  resourceDefaultValues,
} from "@/config/resource-form";
function useUnavailableMutation() {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Thao tác không được hỗ trợ.");
    },
  });
}
function ResourceEditorForm({
  id,
  mode,
  resource: requestedResource,
  section,
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const images = useImageDraft();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const resourceName = requestedResource ?? defaultResourceBySection[section];
  const requestedDefinition = adminResources[resourceName];
  const definition = requestedDefinition ?? adminResources.products;
  const isEditing = mode === "edit";
  const basePath = pathname
    .replace(/\/create$/, "")
    .replace(/\/edit\/[^/]+$/, "");
  const entityQuery = definition.service.getOne(id, {
    enabled: isEditing && Boolean(id),
  });
  const useCreate = definition.service.create ?? useUnavailableMutation;
  const createState = useCreate();
  const updateState = definition.service.update();
  const deleteState = definition.service.remove();
  const fields = useMemo(() => {
    const allFields = buildResourceFields(definition.schema);
    return isEditing && definition.editableFields
      ? allFields.filter((field) =>
          definition.editableFields.includes(field.name),
        )
      : allFields;
  }, [definition, isEditing]);
  const editorData = entityQuery.data;
  const defaultValues = useMemo(
    () => resourceDefaultValues(fields, editorData),
    [editorData, fields],
  );
  const schema = isEditing
    ? definition.schema.update
    : definition.schema.create;
  async function returnToList() {
    const removed = await images.discardAll();
    if (removed.length)
      toast.add({
        title: "Đã hủy và xóa ảnh chưa lưu",
        type: "success",
      });
    await navigate({
      to: basePath,
    });
  }
  const form = useEntityForm({
    defaultValues,
    resetKey: `${resourceName}:${id ?? "create"}:${editorData ? "loaded" : "empty"}`,
    schema,
    onSubmit: async (data) => {
      images.beginSave();
      try {
        if (isEditing)
          await updateState.mutateAsync({
            id,
            data,
          });
        else await createState.mutateAsync(data);
        images.saved();
      } catch (error) {
        images.endSave();
        const restored = await images.discardAll();
        for (const [name, value] of restored)
          form.setFieldValue(name, value ?? null);
        toast.add({
          title: "Không thể lưu dữ liệu",
          description: error.message,
          type: "error",
        });
        return;
      }
      toast.add({
        title: isEditing ? "Đã lưu thay đổi" : "Đã tạo bản ghi",
        type: "success",
      });
      await returnToList();
    },
  });
  async function removeRecord() {
    try {
      await deleteState.mutateAsync(id);
    } catch (error) {
      toast.add({
        title: "Không thể xóa bản ghi",
        description: error.message,
        type: "error",
      });
      return;
    }
    toast.add({
      title: "Đã xóa bản ghi",
      type: "success",
    });
    setConfirmDelete(false);
    await returnToList();
  }
  if (!requestedDefinition)
    return (
      <Alert variant="destructive">
        <AlertTitle>Không tìm thấy loại dữ liệu</AlertTitle>
        <AlertDescription>
          Resource “{resourceName ?? section}” không tồn tại hoặc không được hỗ
          trợ.
        </AlertDescription>
      </Alert>
    );
  if (
    definition.readOnly ||
    (!isEditing && definition.disableCreate) ||
    (isEditing && definition.createOnly)
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không thể thực hiện thao tác</CardTitle>
          <CardDescription>
            {definition.label} không hỗ trợ{" "}
            {isEditing ? "chỉnh sửa" : "tạo trực tiếp"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => void returnToList()}
            type="button"
            variant="outline"
          >
            <ArrowLeft data-icon="inline-start" />
            Quay lại
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (isEditing && entityQuery.isLoading)
    return (
      <div className="grid min-h-64 place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  if (isEditing && !entityQuery.data)
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể mở bản ghi</AlertTitle>
        <AlertDescription>
          {entityQuery.error?.message ?? "Bản ghi không tồn tại."}
        </AlertDescription>
      </Alert>
    );
  const requestError =
    entityQuery.error ??
    createState.error ??
    updateState.error ??
    deleteState.error;
  return (
    <ImageDraftProvider draft={images}>
      <div className="flex flex-col gap-6">
        <header className="flex items-start gap-3">
          <Button
            aria-label="Quay lại"
            onClick={() => void returnToList()}
            size="icon"
            type="button"
            variant="outline"
          >
            <ArrowLeft data-icon="inline-start" />
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              {isEditing
                ? `Chỉnh sửa ${definition.label.toLocaleLowerCase("vi")}`
                : `Tạo ${definition.label.toLocaleLowerCase("vi")}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              Dữ liệu được kiểm tra bằng TanStack Form và Zod trước khi gửi lên
              API.
            </p>
          </div>
        </header>
        {resourceName === "users" && <Reauthentication />}
        <Card>
          <CardHeader>
            <CardTitle>
              Thông tin {definition.label.toLocaleLowerCase("vi")}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? `Mã bản ghi: ${id}`
                : "Điền đầy đủ các trường bắt buộc bên dưới."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit();
              }}
            >
              {requestError ? (
                <Alert variant="destructive">
                  <AlertTitle>Không thể lưu dữ liệu</AlertTitle>
                  <AlertDescription>{requestError.message}</AlertDescription>
                </Alert>
              ) : null}
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                {fields.map((config) => (
                  <form.Field key={config.name} name={config.name}>
                    {(field) => <FormControl config={config} field={field} />}
                  </form.Field>
                ))}
              </FieldGroup>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <div className="flex flex-wrap justify-end gap-3">
                    {isEditing && !definition.disableDelete ? (
                      <Button
                        className="mr-auto"
                        onClick={() => setConfirmDelete(true)}
                        type="button"
                        variant="destructive"
                      >
                        <Trash2 data-icon="inline-start" />
                        Xóa
                      </Button>
                    ) : null}
                    <Button
                      onClick={() => void returnToList()}
                      type="button"
                      variant="outline"
                    >
                      Hủy
                    </Button>
                    <Button
                      disabled={!canSubmit || isSubmitting || images.busy}
                      type="submit"
                    >
                      {isSubmitting ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      {isSubmitting
                        ? "Đang lưu…"
                        : isEditing
                          ? "Lưu thay đổi"
                          : "Tạo mới"}
                    </Button>
                  </div>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>
        <AlertDialog onOpenChange={setConfirmDelete} open={confirmDelete}>
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
                disabled={deleteState.isPending}
                onClick={() => void removeRecord()}
                variant="destructive"
              >
                {deleteState.isPending ? <Spinner className="size-4" /> : null}
                {deleteState.isPending ? "Đang xóa…" : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ImageDraftProvider>
  );
}
export default function ResourceEditor(props) {
  const resource = props.resource ?? defaultResourceBySection[props.section];
  if (resource === "products") return <ProductEditor id={props.id} />;
  return (
    <ResourceEditorForm
      key={`${props.resource ?? props.section}:${props.id ?? props.mode}`}
      {...props}
    />
  );
}
ResourceEditorForm.propTypes = {
  id: PropTypes.string,
  mode: PropTypes.string,
  resource: PropTypes.string,
  section: PropTypes.string,
};
ResourceEditor.propTypes = {
  resource: PropTypes.string,
  section: PropTypes.string,
  id: PropTypes.string,
  mode: PropTypes.oneOf(["create", "edit"]),
};
