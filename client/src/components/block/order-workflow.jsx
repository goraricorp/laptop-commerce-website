import { TableIdentity } from "@/components/element/table-identity";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { FieldGroup } from "@/components/ui/field";
import { useMemo, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import {
  DataTable,
  DataTableColumnHeader,
} from "@/components/custom/data-table";
import { Spinner } from "@/components/ui/spinner";
import { FormDialog } from "@/components/form/form-dialog";
import { useEntityForm } from "@/hooks/use-entity-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { orderStatusChangeSchema } from "@/schemas/order";
import { Input } from "@/components/ui/input";
import { AdminOrderDetail } from "@/components/block/admin-order-detail";
import { changeOrderStatus, useAdminOrderPage } from "@/services/order";
const statuses = {
  pending: {
    label: "Chờ xác nhận",
    next: ["confirmed", "cancelled"],
    variant: "secondary",
  },
  confirmed: {
    label: "Đã xác nhận",
    next: ["processing", "cancelled"],
    variant: "outline",
  },
  processing: {
    label: "Đang xử lý",
    next: ["cancelled"],
    variant: "default",
  },
  completed: {
    label: "Hoàn thành",
    next: [],
    variant: "default",
  },
  cancelled: {
    label: "Đã hủy",
    next: [],
    variant: "destructive",
  },
  returned: {
    label: "Đã hoàn trả",
    next: [],
    variant: "outline",
  },
};
function money(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}
export function OrderWorkflow() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState(""),
    [sort, setSort] = useState("newest"),
    [detail, setDetail] = useState(null);
  const orders = useAdminOrderPage({
    q,
    status: filter,
    sort,
    limit: 25,
  });
  const statusMutation = changeOrderStatus({
    onSuccess: () => {
      setSelected(null);
      void orders.refresh();
    },
  });
  const rows = orders.data?.items ?? [];
  const availableStatuses = useMemo(
    () => (selected ? (statuses[selected.orderStatus]?.next ?? []) : []),
    [selected],
  );
  const defaultValues = useMemo(
    () => ({
      status: availableStatuses[0] ?? "pending",
      note: null,
    }),
    [availableStatuses],
  );
  const form = useEntityForm({
    defaultValues,
    resetKey: selected?.id ?? "none",
    schema: orderStatusChangeSchema,
    onSubmit: (data) =>
      statusMutation.mutateAsync({
        id: selected.id,
        data,
      }),
  });
  const fields = [
    {
      name: "status",
      label: "Trạng thái tiếp theo",
      type: "select",
      options: availableStatuses.map((value) => ({
        value,
        label: statuses[value].label,
      })),
    },
    {
      name: "note",
      label: "Ghi chú xử lý",
      type: "textarea",
      nullable: true,
      optional: true,
      className: "sm:col-span-2",
    },
  ];
  const error = orders.error ?? statusMutation.error;
  const columns = [
    {
      accessorKey: "code",
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mã đơn" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.code}</span>
      ),
    },
    {
      id: "customer",
      accessorFn: (order) =>
        order.customerName ??
        order.customerEmail ??
        order.guestEmail ??
        "Khách vãng lai",
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Khách hàng" />
      ),
      cell: ({ row }) => (
        <TableIdentity
          title={row.original.customerName || "Khách vãng lai"}
          description={row.original.customerEmail || row.original.guestEmail}
        />
      ),
    },
    {
      accessorKey: "orderStatus",
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trạng thái" />
      ),
      cell: ({ row }) => (
        <Badge variant={statuses[row.original.orderStatus]?.variant}>
          {statuses[row.original.orderStatus]?.label ??
            row.original.orderStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "paymentStatus",
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Thanh toán" />
      ),
    },
    {
      accessorKey: "grandTotal",
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tổng tiền" />
      ),
      cell: ({ row }) => money(row.original.grandTotal),
    },
    {
      accessorKey: "createdAt",
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày tạo" />
      ),
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("vi-VN"),
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <span className="block text-right">Xử lý</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetail(row.original.id)}
          >
            Xem đơn
          </Button>
          <Button
            disabled={!statuses[row.original.orderStatus]?.next.length}
            onClick={(event) => {
              event.stopPropagation();
              setSelected(row.original);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Chuyển trạng thái
            <ArrowRight data-icon="inline-start" />
          </Button>
        </div>
      ),
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Luồng xử lý đơn hàng</CardTitle>
        <CardDescription>
          Chỉ cho phép chuyển trạng thái hợp lệ và tự động lưu lịch sử xử lý.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <NativeSelect
            className="w-48"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <NativeSelectOption value="all">
              Tất cả trạng thái
            </NativeSelectOption>
            {Object.entries(statuses).map(([value, config]) => (
              <NativeSelectOption key={value} value={value}>
                {config.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button
            disabled={orders.isFetching}
            onClick={() => void orders.refresh()}
            type="button"
            variant="outline"
          >
            {orders.isFetching ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            Làm mới
          </Button>
          <span className="text-sm text-muted-foreground">
            {orders.data?.total ?? 0} đơn hàng
          </span>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Không thể tải dữ liệu</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQ(new FormData(event.currentTarget).get("q"));
          }}
        >
          <FieldGroup className="flex flex-wrap gap-3">
            <Input
              name="q"
              aria-label="Tìm đơn quản trị"
              placeholder="Mã đơn, tên/email khách hoặc SKU…"
              className="sm:max-w-sm"
            />
            <Button type="submit">Tìm</Button>
            <NativeSelect
              aria-label="Thứ tự đơn quản trị"
              className="w-full"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <NativeSelectOption value="newest">Mới nhất</NativeSelectOption>
              <NativeSelectOption value="oldest">Cũ nhất</NativeSelectOption>
            </NativeSelect>
          </FieldGroup>
        </form>
        <DataTable
          hidePagination
          columns={columns}
          data={rows}
          emptyMessage="Không có đơn hàng phù hợp"
          getRowId={(order) => order.id}
          initialPageSize={25}
        />
        <Pagination
          aria-label="Phân trang quản trị"
          className="flex items-center gap-3 mx-0 w-auto"
        >
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                disabled={orders.page <= 1 || orders.isFetching}
                onClick={orders.previous}
              >
                Trang trước
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span>Trang {orders.page}</span>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                disabled={!orders.data?.hasMore || orders.isFetching}
                onClick={orders.next}
              >
                Trang sau
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardContent>
      <AdminOrderDetail id={detail} onClose={() => setDetail(null)} />
      <FormDialog
        description="Mỗi lần thay đổi sẽ tạo một bản ghi lịch sử và không thể sửa ngược tùy ý."
        entityId={selected?.id}
        error={statusMutation.error}
        fields={fields}
        form={form}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        open={Boolean(selected)}
        title={`Xử lý đơn ${selected?.code ?? ""}`}
      />
    </Card>
  );
}
