import { FieldGroup } from "@/components/ui/field";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import PropTypes from "prop-types";
import { DraftContext, discardImage, base } from "@/hooks/use-image-draft";
import { useContext, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
export function ImageDraftProvider({ draft, children }) {
  return (
    <DraftContext.Provider value={draft}>{children}</DraftContext.Provider>
  );
}
export function ImageField({
  field,
  label,
  nullable = true,
  purpose = "general",
}) {
  const draft = useContext(DraftContext);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  async function upload(file) {
    if (!file) return;
    if (
      !/\.(png|jpe?g|webp)$/i.test(file.name) ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    ) {
      toast.add({
        title: "Chỉ nhận ảnh PNG, JPG, JPEG, WEBP",
        type: "error",
      });
      return;
    }
    if (file.size > 4_000_000) {
      toast.add({
        title: "Ảnh vượt quá giới hạn 4 MB",
        type: "error",
      });
      return;
    }
    setBusy(true);
    draft?.setBusy(true);
    let uploaded;
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(
        `${base}/storage/upload${purpose === "support" ? "?purpose=support" : ""}`,
        {
          method: "POST",
          credentials: "include",
          body,
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? "Upload thất bại.");
      uploaded = result.path;
      if (!draft) {
        await discardImage(result.path);
        throw new Error("Form chưa hỗ trợ lưu ảnh.");
      }
      if (!(await draft.register(field.name, result.path, field.state.value)))
        return;
      field.handleChange(result.url);
      toast.add({
        title: "Đã tải ảnh lên. Bấm lưu để lưu dữ liệu.",
        type: "success",
      });
    } catch (error) {
      if (
        uploaded &&
        !draft?.pending.current.get(field.name)?.key?.includes(uploaded)
      )
        void discardImage(uploaded).catch(() => {});
      toast.add({
        title: "Không thể tải ảnh",
        description: error.message,
        type: "error",
      });
    } finally {
      setBusy(false);
      draft?.setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function cancel() {
    try {
      const original = await draft.discard(field.name);
      field.handleChange(original ?? null);
      toast.add({
        title: "Đã hủy và xóa ảnh chưa lưu",
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: "Không thể hủy ảnh",
        description: error.message,
        type: "error",
      });
    }
  }
  return (
    <FieldGroup className="gap-3">
      <input type="hidden" name={field.name} value={field.state.value ?? ""} />
      {field.state.value ? (
        <img
          className="h-40 w-full rounded-md border object-contain"
          src={field.state.value}
          alt={label}
        />
      ) : (
        <Empty className="h-32 border">
          <EmptyHeader>
            <EmptyDescription>Chưa có ảnh</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <input
        ref={input}
        className="hidden"
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy || draft?.busy}
          onClick={() => input.current?.click()}
        >
          {busy ? "Đang tải…" : "Upload ảnh"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !draft?.pending.current.has(field.name)}
          onClick={() => void cancel()}
        >
          Hủy ảnh mới
        </Button>
        {nullable &&
          field.state.value &&
          !draft?.pending.current.has(field.name) && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                field.handleChange(null);
                toast.add({
                  title: "Ảnh sẽ được gỡ khi lưu thay đổi",
                  type: "success",
                });
              }}
            >
              Gỡ ảnh
            </Button>
          )}
      </div>
    </FieldGroup>
  );
}
ImageDraftProvider.propTypes = {
  draft: PropTypes.object,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
ImageField.propTypes = {
  field: PropTypes.object,
  label: PropTypes.node,
  nullable: PropTypes.bool,
  purpose: PropTypes.string,
};
