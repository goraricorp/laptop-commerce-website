import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import PropTypes from "prop-types";
import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
export function AddressBookDialog({
  open,
  onOpenChange,
  onSave,
  initialAddress,
  user,
}) {
  const fieldIdPrefix = useId();
  const [form, setForm] = useState(() => ({
    recipientName: initialAddress?.recipientName ?? user?.name ?? "",
    phone: initialAddress?.phone ?? user?.phone ?? "",
    type: initialAddress?.type ?? "home",
    addressLine: initialAddress?.addressLine ?? "",
    ward: initialAddress?.ward ?? "",
    district: initialAddress?.district ?? "",
    province: initialAddress?.province ?? "",
    country: initialAddress?.country ?? "Việt Nam",
    isDefault: initialAddress?.isDefault ?? false,
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function save(event) {
    event.preventDefault();
    event.stopPropagation();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onOpenChange(false);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!saving) onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialAddress ? "Sửa địa chỉ" : "Thêm địa chỉ"}
          </DialogTitle>
          <DialogDescription>
            Lưu vào sổ địa chỉ để sử dụng khi mua hàng.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <FieldGroup className="grid gap-4">
            <FieldGroup className="grid gap-3 sm:grid-cols-2">
              {[
                ["recipientName", "Người nhận", "text"],
                ["phone", "Số điện thoại", "tel"],
                ["addressLine", "Số nhà, tên đường", "text"],
                ["ward", "Phường / xã", "text"],
                ["district", "Quận / huyện", "text"],
                ["province", "Tỉnh / thành phố", "text"],
              ].map(([name, label, type]) => (
                <Field key={name} className="grid gap-2">
                  <Label htmlFor={`book-${name}`}>{label}</Label>
                  <Input
                    id={`book-${name}`}
                    name={name}
                    type={type}
                    required={name !== "ward"}
                    minLength={
                      name === "addressLine"
                        ? 5
                        : name === "recipientName"
                          ? 2
                          : 1
                    }
                    maxLength={
                      name === "addressLine" ? 500 : name === "phone" ? 20 : 100
                    }
                    value={form[name]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))
                    }
                  />
                </Field>
              ))}
            </FieldGroup>
            <Field className="grid gap-2">
              <Label htmlFor="book-type">Loại địa chỉ</Label>
              <NativeSelect
                id="book-type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
              >
                <NativeSelectOption value="home">Nhà riêng</NativeSelectOption>
                <NativeSelectOption value="office">
                  Văn phòng
                </NativeSelectOption>
                <NativeSelectOption value="other">Khác</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                checked={form.isDefault}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    isDefault: checked,
                  }))
                }
                id={[fieldIdPrefix, "address-book-dialog-3992"].join("-")}
              />
              <FieldLabel
                htmlFor={[fieldIdPrefix, "address-book-dialog-3992"].join("-")}
              >
                Đặt làm địa chỉ mặc định
              </FieldLabel>
            </Field>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                disabled={saving}
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button disabled={saving} type="submit">
                {saving ? "Đang lưu…" : "Lưu địa chỉ"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
AddressBookDialog.propTypes = {
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  onSave: PropTypes.func,
  initialAddress: PropTypes.object,
  user: PropTypes.object,
};
