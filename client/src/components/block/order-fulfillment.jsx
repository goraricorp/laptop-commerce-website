import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import {
  NativeSelectOption,
  NativeSelect,
} from "@/components/ui/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FieldLabel,
  Field,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import PropTypes from "prop-types";
import { useRef, useState, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils/overview-data";
const labels = {
  requested: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  received: "Đã nhận",
  inspected: "Đã kiểm hàng",
  completed: "Hoàn tất",
  shipped: "Đã bàn giao vận chuyển",
  in_transit: "Đang giao",
  delivered: "Đã giao thành công",
  prepare: "Chuẩn bị giao",
  handover: "Bàn giao vận chuyển",
  retry: "Giao lại",
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  succeeded: "Thành công",
  failed: "Thất bại",
  needs_review: "Cần đối soát",
};
function CommandForm({ title, url, build, mutate, busy, children }) {
  const fieldIdPrefix = useId();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        mutate(url, {
          ...build(data),
          note: data.get("note"),
        });
      }}
    >
      <FieldGroup className="grid gap-3 rounded border p-4">
        <h4 className="font-semibold">{title}</h4>
        {children}
        <Field>
          <FieldLabel
            htmlFor={[fieldIdPrefix, "order-fulfillment-1318"].join("-")}
          >
            Lý do / ghi nhận
          </FieldLabel>
          <Input
            name="note"
            required
            minLength={3}
            maxLength={1000}
            id={[fieldIdPrefix, "order-fulfillment-1318"].join("-")}
          />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? "Đang xử lý…" : title}
        </Button>
      </FieldGroup>
    </form>
  );
}
export function OrderFulfillment({ orderId, admin = false }) {
  const fieldIdPrefix = useId();
  const client = useQueryClient(),
    lastRequest = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const key = ["order-fulfillment", admin, orderId];
  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      caller({
        url: admin
          ? `/admin/fulfillment/orders/${orderId}`
          : `/me/orders/${orderId}/fulfillment`,
      }),
    refetchInterval: expanded ? 15000 : false,
    enabled: expanded,
  });
  const warehouses = useQuery({
    queryKey: ["fulfillment-warehouses"],
    queryFn: () =>
      caller({
        url: "/inventory/location",
        query: {
          limit: 100,
        },
      }),
    enabled: expanded && admin,
  });
  const mutation = useMutation({
    mutationFn: ({ url, data }) =>
      caller({
        url,
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      lastRequest.current = null;
      toast.add({
        title: "Đã ghi nhận thao tác",
        type: "success",
      });
      void client.invalidateQueries({
        queryKey: key,
      });
      void client.invalidateQueries({
        queryKey: ["admin-statistics"],
      });
      void client.invalidateQueries({
        queryKey: ["fulfillment-operations"],
      });
      void client.invalidateQueries({
        queryKey: ["my-order"],
      });
      void client.invalidateQueries({
        queryKey: ["admin-order-detail", orderId],
      });
      void client.invalidateQueries({
        queryKey: ["commerce", "order"],
      });
    },
    onError: (error) =>
      toast.add({
        title: error.message,
        type: "error",
      }),
  });
  function mutate(url, payload) {
    const fingerprint = JSON.stringify({
      url,
      payload,
    });
    if (lastRequest.current?.fingerprint !== fingerprint)
      lastRequest.current = {
        fingerprint,
        commandId: crypto.randomUUID(),
      };
    mutation.mutate({
      url,
      data: {
        ...payload,
        commandId: lastRequest.current.commandId,
      },
    });
  }
  const data = query.data,
    shipment = data?.shipments?.[0];
  const root = `/admin/fulfillment/orders/${orderId}`;
  const common = {
    mutate,
    busy: mutation.isPending,
  };
  return (
    <section className="grid gap-4 border-t pt-4">
      <Button
        variant="outline"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {admin
          ? "Vận chuyển · trả hàng · hoàn tiền"
          : "Theo dõi giao hàng / yêu cầu trả hàng"}
      </Button>
      {expanded && (
        <>
          {query.isPending ? (
            <div role="status">
              <Skeleton className="h-4 w-32" aria-hidden="true" />
              Đang tải hồ sơ…
            </div>
          ) : query.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{query.error.message}</AlertDescription>
            </Alert>
          ) : (
            data && (
              <>
                {mutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {mutation.error.message}
                    </AlertDescription>
                  </Alert>
                )}
                <p>
                  Vận chuyển:{" "}
                  {labels[shipment?.status] ?? "Chưa tạo chuyến giao"}{" "}
                  {shipment?.carrier} {shipment?.trackingNumber}
                </p>
                {data.fulfillment?.deliveredAt && (
                  <p>
                    Giao thành công:{" "}
                    {new Date(data.fulfillment.deliveredAt).toLocaleString(
                      "vi-VN",
                    )}
                    . Thời hạn gửi yêu cầu trả hàng: 15 ngày.
                  </p>
                )}
                {admin && (
                  <>
                    {!shipment && !data.fulfillment?.stockIssuedAt && (
                      <CommandForm
                        title="Chuẩn bị giao"
                        url={`${root}/shipment`}
                        build={(fd) => ({
                          action: "prepare",
                          carrier: fd.get("carrier"),
                          trackingNumber: fd.get("trackingNumber"),
                        })}
                        {...common}
                      >
                        <Field>
                          <FieldLabel
                            htmlFor={[
                              fieldIdPrefix,
                              "order-fulfillment-5679",
                            ].join("-")}
                          >
                            Đơn vị vận chuyển
                          </FieldLabel>
                          <Input
                            name="carrier"
                            required
                            maxLength={100}
                            id={[fieldIdPrefix, "order-fulfillment-5679"].join(
                              "-",
                            )}
                          />
                        </Field>
                        <Field>
                          <FieldLabel
                            htmlFor={[
                              fieldIdPrefix,
                              "order-fulfillment-5864",
                            ].join("-")}
                          >
                            Mã vận đơn
                          </FieldLabel>
                          <Input
                            name="trackingNumber"
                            required
                            maxLength={255}
                            id={[fieldIdPrefix, "order-fulfillment-5864"].join(
                              "-",
                            )}
                          />
                        </Field>
                      </CommandForm>
                    )}
                    {shipment?.status === "processing" && (
                      <CommandForm
                        title="Bàn giao vận chuyển"
                        url={`${root}/shipment`}
                        build={() => ({
                          action: "handover",
                        })}
                        {...common}
                      />
                    )}
                    {shipment?.status === "failed" && (
                      <>
                        <CommandForm
                          title="Giao lại chuyến hàng"
                          url={`${root}/shipment`}
                          build={() => ({
                            action: "retry",
                          })}
                          {...common}
                        />
                        <CommandForm
                          title="Nhận hàng giao thất bại để kiểm tra"
                          url={`${root}/returns`}
                          build={() => ({
                            items: (data.items ?? [])
                              .filter((i) => i.returnableQuantity > 0)
                              .map((i) => ({
                                orderItemId: i.id,
                                quantity: i.returnableQuantity,
                              })),
                          })}
                          {...common}
                        />
                      </>
                    )}
                    {["shipped", "in_transit"].includes(shipment?.status) && (
                      <>
                        <CommandForm
                          title="Xác nhận giao thành công"
                          url={`${root}/shipment`}
                          build={(fd) => ({
                            action: "delivered",
                            ...(fd.get("codProof")
                              ? {
                                  codProof: fd.get("codProof"),
                                }
                              : {}),
                          })}
                          {...common}
                        >
                          <Field>
                            <FieldLabel
                              htmlFor={[
                                fieldIdPrefix,
                                "order-fulfillment-8342",
                              ].join("-")}
                            >
                              Chứng từ thu COD (bắt buộc với COD)
                            </FieldLabel>
                            <Input
                              name="codProof"
                              maxLength={1000}
                              id={[
                                fieldIdPrefix,
                                "order-fulfillment-8342",
                              ].join("-")}
                            />
                          </Field>
                        </CommandForm>
                        <CommandForm
                          title="Ghi nhận giao thất bại"
                          url={`${root}/shipment`}
                          build={() => ({
                            action: "failed",
                          })}
                          {...common}
                        />
                      </>
                    )}
                    {!data.fulfillment?.stockIssuedAt && (
                      <CommandForm
                        title="Hủy đơn đã thanh toán / tạo hồ sơ hoàn"
                        url={`${root}/refunds`}
                        build={(fd) => ({
                          purpose: "paid_cancellation",
                          shippingAmount: Number(fd.get("shippingAmount") || 0),
                          ...(fd.get("shippingReason")
                            ? {
                                shippingReason: fd.get("shippingReason"),
                              }
                            : {}),
                        })}
                        {...common}
                      >
                        <ShippingFields />
                      </CommandForm>
                    )}
                  </>
                )}
                {!admin && data.canRequestReturn && (
                  <CommandForm
                    title="Gửi yêu cầu trả hàng"
                    url={`/me/orders/${orderId}/returns`}
                    build={(fd) => ({
                      items: (data.items ?? [])
                        .map((i) => ({
                          orderItemId: i.id,
                          quantity: Number(fd.get(i.id) || 0),
                        }))
                        .filter((i) => i.quantity > 0),
                    })}
                    {...common}
                  >
                    {(data.items ?? []).map((i) => (
                      <Field key={i.id}>
                        <FieldLabel
                          htmlFor={[
                            fieldIdPrefix,
                            "order-fulfillment-10448",
                            i.id,
                            i.id,
                          ].join("-")}
                        >
                          {i.productName} · {i.variantName} (còn{" "}
                          {i.returnableQuantity})
                        </FieldLabel>
                        <Input
                          aria-label={`Số lượng trả ${i.sku}`}
                          type="number"
                          name={i.id}
                          min={0}
                          max={i.returnableQuantity}
                          defaultValue={0}
                          id={[
                            fieldIdPrefix,
                            "order-fulfillment-10448",
                            i.id,
                            i.id,
                          ].join("-")}
                        />
                      </Field>
                    ))}
                  </CommandForm>
                )}
                {(data.returns ?? []).map((r) => (
                  <article className="grid gap-3 rounded border p-4" key={r.id}>
                    <h4 className="font-semibold">
                      Trả hàng: {labels[r.status] ?? r.status}
                    </h4>
                    <p>{r.reason}</p>
                    {r.items.map((i) => (
                      <p key={i.id}>
                        {
                          data.items?.find((line) => line.id === i.orderItemId)
                            ?.productName
                        }{" "}
                        × {i.quantity} · chấp nhận{" "}
                        {i.acceptedQuantity ?? "chưa kiểm"} · nhập lại{" "}
                        {i.restockQuantity ?? 0} · hoàn{" "}
                        {formatCurrency(i.refundAmount)}
                      </p>
                    ))}
                    {admin && (
                      <>
                        {(
                          {
                            requested: ["approve", "reject"],
                            approved: ["receive"],
                            inspected: ["complete"],
                          }[r.status] ?? []
                        ).map((action) => (
                          <CommandForm
                            key={action}
                            title={
                              {
                                approve: "Duyệt trả hàng",
                                reject: "Từ chối trả hàng",
                                receive: "Nhận hàng trả",
                                complete: "Đóng hồ sơ trả hàng",
                              }[action]
                            }
                            url={`/admin/fulfillment/returns/${r.id}`}
                            build={() => ({
                              action,
                            })}
                            {...common}
                          />
                        ))}
                        {r.status === "received" && (
                          <CommandForm
                            title="Lưu kiểm hàng"
                            url={`/admin/fulfillment/returns/${r.id}`}
                            build={(fd) => ({
                              action: "inspect",
                              items: r.items.map((i) => ({
                                itemId: i.id,
                                acceptedQuantity: Number(
                                  fd.get(`accepted-${i.id}`),
                                ),
                                restockQuantity: Number(
                                  fd.get(`restock-${i.id}`),
                                ),
                                ...(fd.get(`warehouse-${i.id}`)
                                  ? {
                                      locationId: fd.get(`warehouse-${i.id}`),
                                    }
                                  : {}),
                                condition: fd.get(`condition-${i.id}`),
                                note: fd.get(`note-${i.id}`),
                              })),
                            })}
                            {...common}
                          >
                            {r.items.map((i) => (
                              <FieldSet
                                className="grid gap-2 rounded border p-3"
                                key={i.id}
                              >
                                <FieldLegend>
                                  {
                                    data.items?.find(
                                      (line) => line.id === i.orderItemId,
                                    )?.productName
                                  }{" "}
                                  × {i.quantity}
                                </FieldLegend>
                                <Field>
                                  <FieldLabel
                                    htmlFor={[
                                      fieldIdPrefix,
                                      "order-fulfillment-14907",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  >
                                    Số lượng chấp nhận hoàn
                                  </FieldLabel>
                                  <Input
                                    name={`accepted-${i.id}`}
                                    type="number"
                                    min={0}
                                    max={i.quantity}
                                    defaultValue={i.quantity}
                                    required
                                    id={[
                                      fieldIdPrefix,
                                      "order-fulfillment-14907",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  />
                                </Field>
                                <Field>
                                  <FieldLabel
                                    htmlFor={[
                                      fieldIdPrefix,
                                      "order-fulfillment-15440",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  >
                                    Số lượng nhập lại tồn bán được
                                  </FieldLabel>
                                  <Input
                                    name={`restock-${i.id}`}
                                    type="number"
                                    min={0}
                                    max={i.quantity}
                                    defaultValue={0}
                                    required
                                    id={[
                                      fieldIdPrefix,
                                      "order-fulfillment-15440",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  />
                                </Field>
                                <Field>
                                  <FieldLabel
                                    htmlFor={[
                                      fieldIdPrefix,
                                      "order-fulfillment-15970",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  >
                                    Tình trạng
                                  </FieldLabel>
                                  <NativeSelect
                                    className="w-full"
                                    name={`condition-${i.id}`}
                                    aria-label="Tình trạng"
                                    id={[
                                      fieldIdPrefix,
                                      "order-fulfillment-15970",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  >
                                    <NativeSelectOption value="resellable">
                                      Bán lại được
                                    </NativeSelectOption>
                                    <NativeSelectOption value="damaged">
                                      Hư hỏng
                                    </NativeSelectOption>
                                    <NativeSelectOption value="incomplete">
                                      Thiếu phụ kiện
                                    </NativeSelectOption>
                                    <NativeSelectOption value="other">
                                      Khác
                                    </NativeSelectOption>
                                  </NativeSelect>
                                </Field>
                                <Field>
                                  <FieldLabel
                                    htmlFor={[
                                      fieldIdPrefix,
                                      "order-fulfillment-16888",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  >
                                    Kho nhận
                                  </FieldLabel>
                                  <NativeSelect
                                    name={`warehouse-${i.id}`}
                                    aria-label="Kho nhận"
                                    className="w-full"
                                    id={[
                                      fieldIdPrefix,
                                      "order-fulfillment-16888",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  >
                                    <NativeSelectOption value="">
                                      Chọn kho nếu nhập lại
                                    </NativeSelectOption>
                                    {(warehouses.data?.items ?? [])
                                      .filter((w) => w.isActive)
                                      .map((w) => (
                                        <NativeSelectOption
                                          key={w.id}
                                          value={w.id}
                                        >
                                          {w.name} ({w.code})
                                        </NativeSelectOption>
                                      ))}
                                  </NativeSelect>
                                </Field>
                                <Field>
                                  <FieldLabel
                                    htmlFor={[
                                      fieldIdPrefix,
                                      "order-fulfillment-17901",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  >
                                    Biên bản kiểm tra
                                  </FieldLabel>
                                  <Input
                                    name={`note-${i.id}`}
                                    required
                                    minLength={3}
                                    id={[
                                      fieldIdPrefix,
                                      "order-fulfillment-17901",
                                      i.id,
                                      r.id,
                                    ].join("-")}
                                  />
                                </Field>
                              </FieldSet>
                            ))}
                          </CommandForm>
                        )}
                        {r.status === "inspected" &&
                          !(data.refunds ?? []).some(
                            (x) => x.returnId === r.id,
                          ) && (
                            <CommandForm
                              title="Tạo yêu cầu hoàn tiền hàng trả"
                              url={`${root}/refunds`}
                              build={(fd) => ({
                                purpose: "return",
                                returnId: r.id,
                                shippingAmount: Number(
                                  fd.get("shippingAmount") || 0,
                                ),
                                ...(fd.get("shippingReason")
                                  ? {
                                      shippingReason: fd.get("shippingReason"),
                                    }
                                  : {}),
                              })}
                              {...common}
                            >
                              <ShippingFields />
                            </CommandForm>
                          )}
                      </>
                    )}
                    {(r.events ?? []).map((event, i) => (
                      <p className="text-sm text-muted-foreground" key={i}>
                        {new Date(event.createdAt).toLocaleString("vi-VN")} ·{" "}
                        {labels[event.status] ?? event.status} · {event.note}
                      </p>
                    ))}
                  </article>
                ))}
                {admin && (
                  <CommandForm
                    title="Hoàn riêng phí giao hàng"
                    url={`${root}/refunds`}
                    build={(fd) => ({
                      purpose: "shipping",
                      shippingAmount: Number(fd.get("shippingAmount") || 0),
                      shippingReason: fd.get("shippingReason"),
                    })}
                    {...common}
                  >
                    <ShippingFields />
                  </CommandForm>
                )}
                {(data.refunds ?? []).map((r) => (
                  <article key={r.id} className="grid gap-3 rounded border p-4">
                    <h4>
                      Hoàn {formatCurrency(r.amount)}:{" "}
                      {labels[r.state] ?? r.state}
                    </h4>
                    <p>
                      Phí giao được hoàn: {formatCurrency(r.shippingAmount)}
                    </p>
                    {admin && (
                      <>
                        <p>
                          {r.provider} · {r.reference} · {r.lastError}
                        </p>
                        <p>Lý do: {r.reason}</p>
                        {r.proof && <p>Chứng từ: {r.proof}</p>}
                        {r.provider === "cod" && r.state === "pending" && (
                          <CommandForm
                            title="Xác nhận đã hoàn COD"
                            url={`/admin/fulfillment/refunds/${r.id}/confirm`}
                            build={(fd) => ({
                              proof: fd.get("proof"),
                            })}
                            {...common}
                          >
                            <Field>
                              <FieldLabel
                                htmlFor={[
                                  fieldIdPrefix,
                                  "order-fulfillment-21709",
                                  r.id,
                                ].join("-")}
                              >
                                Chứng từ chuyển trả tiền
                              </FieldLabel>
                              <Input
                                name="proof"
                                required
                                minLength={3}
                                id={[
                                  fieldIdPrefix,
                                  "order-fulfillment-21709",
                                  r.id,
                                ].join("-")}
                              />
                            </Field>
                          </CommandForm>
                        )}
                        {r.provider !== "cod" &&
                          !["succeeded", "failed"].includes(r.state) && (
                            <CommandForm
                              title="Yêu cầu đối soát lại"
                              url={`/admin/fulfillment/refunds/${r.id}/reconcile`}
                              build={(fd) => ({
                                ...(fd.get("providerRefundId")
                                  ? {
                                      providerRefundId:
                                        fd.get("providerRefundId"),
                                    }
                                  : {}),
                              })}
                              {...common}
                            >
                              {r.provider === "paypal" && (
                                <Field>
                                  <FieldLabel
                                    htmlFor={[
                                      fieldIdPrefix,
                                      "order-fulfillment-22809",
                                      r.id,
                                    ].join("-")}
                                  >
                                    Mã hoàn PayPal từ dashboard (nếu timeout)
                                  </FieldLabel>
                                  <Input
                                    name="providerRefundId"
                                    maxLength={100}
                                    id={[
                                      fieldIdPrefix,
                                      "order-fulfillment-22809",
                                      r.id,
                                    ].join("-")}
                                  />
                                </Field>
                              )}
                            </CommandForm>
                          )}
                      </>
                    )}
                  </article>
                ))}
                {(data.events ?? []).map((event, i) => (
                  <p className="text-sm text-muted-foreground" key={i}>
                    {new Date(event.createdAt).toLocaleString("vi-VN")} ·{" "}
                    {labels[event.type] ?? event.type} · {event.note}
                  </p>
                ))}
                {!data.returns?.length && !data.canRequestReturn && !admin && (
                  <Empty>
                    <EmptyHeader>
                      <EmptyDescription>
                        Chưa có yêu cầu trả hàng. Chỉ gửi yêu cầu trong 15 ngày
                        sau khi giao thành công.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </>
            )
          )}
        </>
      )}
    </section>
  );
}
function ShippingFields() {
  const fieldIdPrefix = useId();
  return (
    <>
      <Field>
        <FieldLabel
          htmlFor={[fieldIdPrefix, "order-fulfillment-24053"].join("-")}
        >
          Phí giao hoàn thêm (mặc định 0)
        </FieldLabel>
        <Input
          name="shippingAmount"
          type="number"
          min={0}
          defaultValue={0}
          id={[fieldIdPrefix, "order-fulfillment-24053"].join("-")}
        />
      </Field>
      <Field>
        <FieldLabel
          htmlFor={[fieldIdPrefix, "order-fulfillment-24201"].join("-")}
        >
          Lý do hoàn phí giao
        </FieldLabel>
        <Input
          name="shippingReason"
          maxLength={1000}
          id={[fieldIdPrefix, "order-fulfillment-24201"].join("-")}
        />
      </Field>
    </>
  );
}
export function FulfillmentOperations() {
  const query = useQuery({
    queryKey: ["fulfillment-operations"],
    queryFn: () =>
      caller({
        url: "/admin/fulfillment/operations",
      }),
    refetchInterval: 30000,
  });
  return (
    <section className="grid gap-3 rounded border p-4">
      <h2 className="text-lg font-semibold">Vận hành hàng đợi</h2>
      <Button variant="outline" onClick={() => void query.refetch()}>
        Làm mới vận hành
      </Button>
      {query.isPending ? (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          tải…
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      ) : (
        <>
          {!(query.data?.jobs ?? []).length && (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>
                  Chưa có lần chạy scheduler. Cần cấu hình scheduler ngoài để xử
                  lý thanh toán, hoàn tiền, email và ảnh.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {(query.data?.jobs ?? []).map((j) => (
            <p key={j.name}>
              {j.name} · lần cuối:{" "}
              {j.lastFinishedAt
                ? new Date(j.lastFinishedAt).toLocaleString("vi-VN")
                : "chưa hoàn tất"}{" "}
              · {j.lastError ?? "không ghi nhận lỗi"}
            </p>
          ))}
          {(query.data?.backlog ?? []).map((row, i) => (
            <p key={i}>
              {row.kind} · {row.state}: {row.count} · {row.error}
            </p>
          ))}
          {(query.data?.returns ?? []).map((r) => (
            <Collapsible key={r.id}>
              <CollapsibleTrigger render={<Button variant="outline" />}>
                Hồ sơ trả hàng · {labels[r.status]} (tổng đang mở: {r.total})
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <OrderFulfillment orderId={r.order_id} admin />
              </CollapsibleContent>
            </Collapsible>
          ))}
          {(query.data?.paidLate ?? []).map((r) => (
            <Collapsible key={r.order_id}>
              <CollapsibleTrigger render={<Button variant="outline" />}>
                Đơn thanh toán đến muộn cần xử lý
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <OrderFulfillment orderId={r.order_id} admin />
              </CollapsibleContent>
            </Collapsible>
          ))}
          {(query.data?.refunds ?? []).map((r) => (
            <Collapsible key={r.id}>
              <CollapsibleTrigger render={<Button variant="outline" />}>
                Khoản hoàn {formatCurrency(r.amount)} · {labels[r.state]} ·{" "}
                {r.last_error}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <OrderFulfillment orderId={r.order_id} admin />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </>
      )}
    </section>
  );
}
CommandForm.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  build: PropTypes.func.isRequired,
  mutate: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  children: PropTypes.node,
};
OrderFulfillment.propTypes = {
  orderId: PropTypes.string.isRequired,
  admin: PropTypes.bool,
};
