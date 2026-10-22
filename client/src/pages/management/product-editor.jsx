import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  NativeSelectOption,
  NativeSelect,
} from "@/components/ui/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldLabel, Field, FieldSet, FieldGroup } from "@/components/ui/field";
import PropTypes from "prop-types";
import { useRef, useState, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { caller } from "@/lib/utils/caller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { RelationPicker } from "@/components/form/relation-picker";
import {
  ImageDraftProvider,
  ImageField,
} from "@/components/upload/image-field";
import { useImageDraft } from "@/hooks/use-image-draft";
function blank() {
  return {
    product: {
      name: "",
      slug: "",
      categoryId: null,
      brandId: null,
      summary: "",
      status: "draft",
    },
    variants: [],
    media: [],
    content: [],
    balances: [],
  };
}
function EditorForm({ data, id, onSaved, onReload }) {
  const fieldIdPrefix = useId();
  const [model, setModel] = useState(() => structuredClone(data)),
    draft = useImageDraft(),
    request = useRef(null);
  const [stock, setStock] = useState(() =>
    data.balances.map((b) => ({
      ...b,
      expectedOnHand: b.quantityOnHand,
      expectedReserved: b.quantityReserved,
      reason: "",
      originalReorderLevel: b.reorderLevel,
    })),
  );
  const type = useQuery({
    queryKey: ["product-category-type", model.product.categoryId],
    enabled: Boolean(model.product.categoryId),
    queryFn: () =>
      caller({
        url: `/admin/pickers/categories/${model.product.categoryId}`,
      }),
  });
  const mutation = useMutation({
    mutationFn: (payload) =>
      caller({
        url: `/admin/product-editor/${id}`,
        method: "PUT",
        body: payload,
      }),
    onSuccess: (result) => {
      draft.saved();
      toast.add({
        title: "Đã lưu sản phẩm, SKU và các quan hệ",
        type: "success",
      });
      onSaved(result);
    },
    onError: async (e) => {
      const discarded = await draft.discardAll();
      for (const [name, url] of discarded) {
        if (name.startsWith("media-"))
          change("media", name.slice(6), "url", url);
        if (name.startsWith("content-"))
          change("content", name.slice(8), "imageUrl", url);
      }
      toast.add({
        title: e.message,
        type: "error",
      });
    },
    onSettled: () => draft.endSave(),
  });
  function change(group, rowId, key, value) {
    setModel((m) => ({
      ...m,
      [group]:
        group === "product"
          ? {
              ...m.product,
              [key]: value,
            }
          : m[group].map((row) =>
              row.id === rowId
                ? {
                    ...row,
                    [key]: value,
                  }
                : row,
            ),
    }));
  }
  function add(group) {
    const row =
      group === "variants"
        ? {
            id: crypto.randomUUID(),
            sku: "",
            name: "",
            price: "0",
            costPrice: null,
            compareAtPrice: null,
            status: "active",
            barcode: null,
            weightGrams: null,
            attributeValueIds: [],
          }
        : group === "media"
          ? {
              id: crypto.randomUUID(),
              variantId: null,
              url: null,
              mediaType: "image",
              alt: "",
              position: model.media.length,
              isPrimary: !model.media.length,
            }
          : {
              id: crypto.randomUUID(),
              format: "plain",
              title: "",
              content: "",
              imageUrl: null,
              position: model.content.length,
            };
    setModel((m) => ({
      ...m,
      [group]: [...m[group], row],
    }));
  }
  async function remove(group, row) {
    if (group === "media" || group === "content")
      await draft.discard(`${group}-${row.id}`).catch((e) =>
        toast.add({
          title: e.message,
          type: "error",
        }),
      );
    if (
      group === "variants" &&
      model.media.some((m) => m.variantId === row.id)
    ) {
      toast.add({
        title: "Gỡ liên kết ảnh với SKU trước khi ngừng bán SKU này.",
        type: "error",
      });
      return;
    }
    setModel((m) => ({
      ...m,
      [group]: m[group]
        .filter((r) => r.id !== row.id)
        .map((r, i) =>
          group === "variants"
            ? r
            : {
                ...r,
                position: i,
              },
        ),
    }));
    if (group === "variants")
      setStock((rows) => rows.filter((r) => r.variantId !== row.id));
  }
  function move(group, index, delta) {
    const rows = [...model[group]],
      target = index + delta;
    if (target < 0 || target >= rows.length) return;
    [rows[index], rows[target]] = [rows[target], rows[index]];
    setModel((m) => ({
      ...m,
      [group]: rows.map((r, i) => ({
        ...r,
        position: i,
      })),
    }));
  }
  function payload() {
    const { name, slug, categoryId, brandId, summary, status } = model.product;
    return {
      expectedVersion: data.product.version ?? null,
      product: {
        name,
        slug,
        categoryId,
        brandId,
        summary,
        status,
      },
      variants: model.variants.map(
        ({
          id,
          sku,
          name,
          price,
          costPrice,
          compareAtPrice,
          status,
          barcode,
          weightGrams,
          attributeValueIds,
        }) => ({
          id,
          sku,
          name,
          price,
          costPrice,
          compareAtPrice,
          status,
          barcode: barcode || null,
          weightGrams,
          attributeValueIds,
        }),
      ),
      media: model.media.map(
        ({ id, variantId, url, mediaType, alt, position, isPrimary }) => ({
          id,
          variantId,
          url,
          mediaType,
          alt,
          position,
          isPrimary,
        }),
      ),
      content: model.content.map(
        ({ id, format, title, content, imageUrl, position }) => ({
          id,
          format,
          title,
          content,
          imageUrl,
          position,
        }),
      ),
      inventory: stock
        .filter(
          (s) =>
            s.isNew ||
            s.quantityOnHand !== s.expectedOnHand ||
            s.reorderLevel !== s.originalReorderLevel,
        )
        .map(
          ({
            variantId,
            locationId,
            expectedOnHand,
            expectedReserved,
            quantityOnHand,
            reorderLevel,
            reason,
          }) => ({
            variantId,
            locationId,
            expectedOnHand,
            expectedReserved,
            quantityOnHand,
            reorderLevel,
            reason,
          }),
        ),
    };
  }
  const image = (group, row) => {
    const name = `${group}-${row.id}`,
      key = group === "media" ? "url" : "imageUrl";
    return (
      <ImageField
        field={{
          name,
          state: {
            value: row[key],
          },
          handleChange: (value) => change(group, row.id, key, value),
        }}
        label={group === "media" ? "Ảnh sản phẩm" : "Ảnh nội dung"}
        nullable={group !== "media"}
      />
    );
  };
  const text = (group, row, key, label, inputOptions = {}) => (
    <Field key={key}>
      <FieldLabel
        htmlFor={[fieldIdPrefix, "product-editor-7466", key, key, row?.id].join(
          "-",
        )}
      >
        {label}
      </FieldLabel>
      <Input
        aria-label={`${label}${group === "product" ? "" : ` ${row.name ?? row.id}`}`}
        value={row[key] ?? ""}
        onChange={(e) =>
          change(
            group,
            row.id,
            key,
            inputOptions.type === "number"
              ? e.target.value === ""
                ? null
                : Number(e.target.value)
              : e.target.value,
          )
        }
        {...inputOptions}
        id={[fieldIdPrefix, "product-editor-7466", key, key, row?.id].join("-")}
      />
    </Field>
  );
  return (
    <ImageDraftProvider draft={draft}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body = payload(),
            fingerprint = JSON.stringify(body);
          if (request.current?.fingerprint !== fingerprint)
            request.current = {
              fingerprint,
              id: crypto.randomUUID(),
            };
          draft.beginSave();
          mutation.mutate({
            ...body,
            requestId: request.current.id,
          });
        }}
      >
        <FieldGroup className="grid gap-6">
          <h1 className="text-2xl font-semibold">Biên tập sản phẩm đầy đủ</h1>
          <p>
            Lưu sản phẩm, SKU, thông số, nội dung, ảnh và điều chỉnh kho trong
            cùng một giao dịch. Bản sửa cũ sẽ bị từ chối nếu dữ liệu đã thay
            đổi.
          </p>
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                <p>{mutation.error.message}</p>
                {mutation.error.details?.issues?.map((issue, i) => (
                  <p key={i}>
                    {issue.path.join(" → ")}: {issue.message}
                  </p>
                ))}
              </AlertDescription>
            </Alert>
          )}
          <FieldSet
            className="grid gap-5"
            disabled={mutation.isPending || draft.busy}
          >
            <section className="grid gap-3 rounded border p-4 sm:grid-cols-2">
              <h2 className="font-semibold sm:col-span-2">
                Thông tin sản phẩm
              </h2>
              {text("product", model.product, "name", "Tên sản phẩm", {
                required: true,
              })}
              {text("product", model.product, "slug", "Đường dẫn", {
                required: true,
              })}
              <RelationPicker
                resource="categories"
                value={model.product.categoryId}
                onChange={(value) =>
                  change("product", null, "categoryId", value)
                }
                label="Danh mục"
              />
              <RelationPicker
                resource="brands"
                value={model.product.brandId}
                onChange={(value) => change("product", null, "brandId", value)}
                label="Thương hiệu"
              />
              <Field>
                <FieldLabel
                  htmlFor={[fieldIdPrefix, "product-editor-10095"].join("-")}
                >
                  Loại sản phẩm (từ danh mục)
                </FieldLabel>
                <Input
                  readOnly
                  value={
                    model.product.categoryId
                      ? (type.data?.items?.[0]?.productType ?? "Đang xác định…")
                      : "other"
                  }
                  id={[fieldIdPrefix, "product-editor-10095"].join("-")}
                />
              </Field>
              <Field>
                <FieldLabel
                  htmlFor={[fieldIdPrefix, "product-editor-10435"].join("-")}
                >
                  Trạng thái sản phẩm
                </FieldLabel>
                <NativeSelect
                  className="w-full"
                  value={model.product.status}
                  onChange={(e) =>
                    change("product", null, "status", e.target.value)
                  }
                  id={[fieldIdPrefix, "product-editor-10435"].join("-")}
                >
                  <NativeSelectOption value="draft">Nháp</NativeSelectOption>
                  <NativeSelectOption value="active">Mở bán</NativeSelectOption>
                  <NativeSelectOption value="inactive">
                    Ngừng bán
                  </NativeSelectOption>
                  <NativeSelectOption value="archived">
                    Lưu trữ
                  </NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel
                  htmlFor={[fieldIdPrefix, "product-editor-11015"].join("-")}
                >
                  Tóm tắt
                </FieldLabel>
                <Textarea
                  value={model.product.summary ?? ""}
                  onChange={(e) =>
                    change("product", null, "summary", e.target.value)
                  }
                  id={[fieldIdPrefix, "product-editor-11015"].join("-")}
                />
              </Field>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">SKU và thông số</h2>
              {model.variants.map((v) => (
                <article
                  key={v.id}
                  className="grid gap-3 rounded border p-4 sm:grid-cols-2"
                >
                  {text("variants", v, "sku", "Mã SKU", {
                    required: true,
                  })}
                  {text("variants", v, "name", "Tên SKU", {
                    required: true,
                  })}
                  {text("variants", v, "price", "Giá bán", {
                    type: "number",
                    min: 0,
                    required: true,
                    step: 1,
                  })}
                  {text("variants", v, "costPrice", "Giá vốn", {
                    type: "number",
                    min: 0,
                    step: 1,
                  })}
                  {text("variants", v, "compareAtPrice", "Giá niêm yết", {
                    type: "number",
                    min: 0,
                    step: 1,
                  })}
                  {text("variants", v, "weightGrams", "Khối lượng gram", {
                    type: "number",
                    min: 0,
                    step: 1,
                  })}
                  {text("variants", v, "barcode", "Mã vạch")}
                  <Field>
                    <FieldLabel
                      htmlFor={[
                        fieldIdPrefix,
                        "product-editor-12648",
                        v.id,
                      ].join("-")}
                    >
                      Trạng thái SKU
                    </FieldLabel>
                    <NativeSelect
                      className="w-full"
                      value={v.status}
                      onChange={(e) =>
                        change("variants", v.id, "status", e.target.value)
                      }
                      id={[fieldIdPrefix, "product-editor-12648", v.id].join(
                        "-",
                      )}
                    >
                      {[
                        "active",
                        "inactive",
                        "out_of_stock",
                        "discontinued",
                      ].map((s) => (
                        <NativeSelectOption key={s} value={s}>
                          {
                            {
                              active: "Mở bán",
                              inactive: "Ngừng bán",
                              out_of_stock: "Hết hàng",
                              discontinued: "Dừng kinh doanh",
                            }[s]
                          }
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <div className="grid gap-3 sm:col-span-2">
                    <h3 className="font-semibold">Giá trị thông số</h3>
                    {v.attributeValueIds.map((value, index) => (
                      <div
                        className="flex flex-col gap-2"
                        key={`${v.id}:${index}`}
                      >
                        <RelationPicker
                          resource="attribute-values"
                          value={value}
                          label={`Thông số ${index + 1} của ${v.name || "SKU"}`}
                          onChange={(selected) =>
                            change(
                              "variants",
                              v.id,
                              "attributeValueIds",
                              v.attributeValueIds.map((old, i) =>
                                i === index ? selected : old,
                              ),
                            )
                          }
                        />
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            change(
                              "variants",
                              v.id,
                              "attributeValueIds",
                              v.attributeValueIds.filter((_, i) => i !== index),
                            )
                          }
                        >
                          Bỏ thông số
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        change("variants", v.id, "attributeValueIds", [
                          ...v.attributeValueIds,
                          null,
                        ])
                      }
                    >
                      Thêm thông số
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void remove("variants", v)}
                  >
                    Gỡ SKU (SKU cũ được ngừng bán)
                  </Button>
                </article>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => add("variants")}
              >
                Thêm SKU
              </Button>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Ảnh và thứ tự hiển thị</h2>
              {model.media.map((m, index) => (
                <article className="grid gap-3 rounded border p-4" key={m.id}>
                  {image("media", m)}
                  {text("media", m, "alt", "Mô tả ảnh")}
                  <Field>
                    <FieldLabel
                      htmlFor={[
                        fieldIdPrefix,
                        "product-editor-16445",
                        m.id,
                      ].join("-")}
                    >
                      Ảnh dành cho
                    </FieldLabel>
                    <NativeSelect
                      className="w-full"
                      value={m.variantId ?? ""}
                      onChange={(e) =>
                        change(
                          "media",
                          m.id,
                          "variantId",
                          e.target.value || null,
                        )
                      }
                      id={[fieldIdPrefix, "product-editor-16445", m.id].join(
                        "-",
                      )}
                    >
                      <NativeSelectOption value="">
                        Toàn sản phẩm
                      </NativeSelectOption>
                      {model.variants.map((v) => (
                        <NativeSelectOption value={v.id} key={v.id}>
                          {v.name || v.sku || "SKU mới"}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field orientation="horizontal">
                    <Checkbox
                      checked={m.isPrimary}
                      onCheckedChange={(checked) =>
                        change("media", m.id, "isPrimary", checked)
                      }
                      id={[fieldIdPrefix, "product-editor-17116", m.id].join(
                        "-",
                      )}
                    />
                    <FieldLabel
                      htmlFor={[
                        fieldIdPrefix,
                        "product-editor-17116",
                        m.id,
                      ].join("-")}
                    >
                      {" "}
                      Ảnh chính
                    </FieldLabel>
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={index === 0}
                      onClick={() => move("media", index, -1)}
                    >
                      Ảnh lên
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={index === model.media.length - 1}
                      onClick={() => move("media", index, 1)}
                    >
                      Ảnh xuống
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void remove("media", m)}
                    >
                      Gỡ ảnh
                    </Button>
                  </div>
                </article>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => add("media")}
              >
                Thêm ảnh sản phẩm
              </Button>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Các phần nội dung</h2>
              {model.content.map((c, index) => (
                <article key={c.id} className="grid gap-3 rounded border p-4">
                  {text("content", c, "title", "Tiêu đề nội dung")}
                  <Field>
                    <FieldLabel
                      htmlFor={[
                        fieldIdPrefix,
                        "product-editor-18898",
                        c.id,
                      ].join("-")}
                    >
                      Định dạng
                    </FieldLabel>
                    <NativeSelect
                      value={c.format}
                      className="w-full"
                      onChange={(e) =>
                        change("content", c.id, "format", e.target.value)
                      }
                      id={[fieldIdPrefix, "product-editor-18898", c.id].join(
                        "-",
                      )}
                    >
                      <NativeSelectOption value="plain">
                        Văn bản thuần
                      </NativeSelectOption>
                      <NativeSelectOption value="html">
                        HTML được lọc an toàn
                      </NativeSelectOption>
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel
                      htmlFor={[
                        fieldIdPrefix,
                        "product-editor-19410",
                        c.id,
                      ].join("-")}
                    >
                      Nội dung
                    </FieldLabel>
                    <Textarea
                      value={c.content ?? ""}
                      onChange={(e) =>
                        change("content", c.id, "content", e.target.value)
                      }
                      id={[fieldIdPrefix, "product-editor-19410", c.id].join(
                        "-",
                      )}
                    />
                  </Field>
                  {image("content", c)}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={index === 0}
                      onClick={() => move("content", index, -1)}
                    >
                      Nội dung lên
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={index === model.content.length - 1}
                      onClick={() => move("content", index, 1)}
                    >
                      Nội dung xuống
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void remove("content", c)}
                    >
                      Gỡ nội dung
                    </Button>
                  </div>
                </article>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => add("content")}
              >
                Thêm phần nội dung
              </Button>
            </section>
            <section className="grid gap-3">
              <h2 className="text-xl font-semibold">Kho và điều chỉnh tồn</h2>
              <p>
                Lượng đã giữ không được sửa ở đây; tồn sau điều chỉnh phải đủ
                phần đã giữ.
              </p>
              {stock.map((s, index) => {
                const update = (key, value) =>
                  setStock((old) =>
                    old.map((row, i) =>
                      i === index
                        ? {
                            ...row,
                            [key]: value,
                          }
                        : row,
                    ),
                  );
                return (
                  <article
                    key={`${s.variantId}:${index}`}
                    className="grid gap-3 rounded border p-4 sm:grid-cols-2"
                  >
                    <Field data-disabled={!s.isNew}>
                      <FieldLabel
                        htmlFor={[
                          fieldIdPrefix,
                          "product-editor-21743",
                          `${s.variantId}:${index}`,
                        ].join("-")}
                      >
                        SKU kho
                      </FieldLabel>
                      <NativeSelect
                        disabled={!s.isNew}
                        value={s.variantId}
                        className="w-full"
                        onChange={(e) => update("variantId", e.target.value)}
                        id={[
                          fieldIdPrefix,
                          "product-editor-21743",
                          `${s.variantId}:${index}`,
                        ].join("-")}
                      >
                        {model.variants.map((v) => (
                          <NativeSelectOption value={v.id} key={v.id}>
                            {v.name || v.sku || "SKU mới"}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                    <RelationPicker
                      resource="inventory-locations"
                      value={s.locationId}
                      onChange={(value) => update("locationId", value)}
                      disabled={!s.isNew}
                      nullable={false}
                      label="Kho nhận tồn"
                    />
                    <p>Đang giữ: {s.expectedReserved}</p>
                    <Field>
                      <FieldLabel
                        htmlFor={[
                          fieldIdPrefix,
                          "product-editor-22740",
                          `${s.variantId}:${index}`,
                        ].join("-")}
                      >
                        Tồn thực tế sau điều chỉnh
                      </FieldLabel>
                      <Input
                        type="number"
                        required
                        min={s.expectedReserved}
                        value={s.quantityOnHand}
                        onChange={(e) =>
                          update("quantityOnHand", Number(e.target.value))
                        }
                        id={[
                          fieldIdPrefix,
                          "product-editor-22740",
                          `${s.variantId}:${index}`,
                        ].join("-")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel
                        htmlFor={[
                          fieldIdPrefix,
                          "product-editor-23187",
                          `${s.variantId}:${index}`,
                        ].join("-")}
                      >
                        Ngưỡng nhập lại
                      </FieldLabel>
                      <Input
                        type="number"
                        required
                        min={0}
                        value={s.reorderLevel}
                        onChange={(e) =>
                          update("reorderLevel", Number(e.target.value))
                        }
                        id={[
                          fieldIdPrefix,
                          "product-editor-23187",
                          `${s.variantId}:${index}`,
                        ].join("-")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel
                        htmlFor={[
                          fieldIdPrefix,
                          "product-editor-23602",
                          `${s.variantId}:${index}`,
                        ].join("-")}
                      >
                        Lý do điều chỉnh
                      </FieldLabel>
                      <Input
                        value={s.reason}
                        onChange={(e) => update("reason", e.target.value)}
                        id={[
                          fieldIdPrefix,
                          "product-editor-23602",
                          `${s.variantId}:${index}`,
                        ].join("-")}
                      />
                    </Field>
                  </article>
                );
              })}
              <Button
                type="button"
                variant="outline"
                disabled={!model.variants.length}
                onClick={() =>
                  setStock((rows) => [
                    ...rows,
                    {
                      variantId: model.variants[0].id,
                      locationId: null,
                      expectedOnHand: 0,
                      expectedReserved: 0,
                      quantityOnHand: 0,
                      reorderLevel: 0,
                      reason: "",
                      isNew: true,
                    },
                  ])
                }
              >
                Thêm tồn tại kho
              </Button>
            </section>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={mutation.isPending || draft.busy}>
                Lưu toàn bộ sản phẩm
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await draft.discardAll();
                  onReload();
                }}
              >
                Tải lại từ máy chủ
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await draft.discardAll();
                  window.location.assign("/admin/products");
                }}
              >
                Hủy biên tập
              </Button>
            </div>
          </FieldSet>
        </FieldGroup>
      </form>
    </ImageDraftProvider>
  );
}
EditorForm.propTypes = {
  data: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  onSaved: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired,
};
export default function ProductEditor({ id: requestedId }) {
  const [id] = useState(() => requestedId ?? crypto.randomUUID()),
    [exists, setExists] = useState(Boolean(requestedId)),
    [revision, setRevision] = useState(0),
    client = useQueryClient();
  const query = useQuery({
    queryKey: ["product-editor", id],
    enabled: exists,
    queryFn: () =>
      caller({
        url: `/admin/product-editor/${id}`,
      }),
  });
  if (exists && query.isPending)
    return (
      <div role="status">
        <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
        tải sản phẩm…
      </div>
    );
  if (exists && query.isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{query.error.message}</AlertDescription>
      </Alert>
    );
  return (
    <div className="grid gap-5">
      <Link className="underline" to="/admin/products">
        Về danh sách sản phẩm
      </Link>
      <EditorForm
        key={`${id}:${query.data?.product.version ?? "new"}:${revision}`}
        id={id}
        data={query.data ?? blank()}
        onSaved={(result) => {
          client.setQueryData(["product-editor", id], result);
          setExists(true);
          void client.invalidateQueries({
            queryKey: ["commerce", "catalog"],
          });
        }}
        onReload={async () => {
          if (exists) await query.refetch();
          setRevision((n) => n + 1);
        }}
      />
    </div>
  );
}
ProductEditor.propTypes = {
  id: PropTypes.string,
};
