import { TableIdentity } from "@/components/element/table-identity";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldLabel, Field } from "@/components/ui/field";
import {
  Boxes,
  CircleDollarSign,
  PackageSearch,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  DataTable,
  DataTableColumnHeader,
} from "@/components/custom/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/overview-data";
import { useState, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";
import { AdminOrderDetail } from "@/components/block/admin-order-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const orderLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  returned: "Hoàn trả",
};
export function AdminStatistics() {
  const fieldIdPrefix = useId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const query = useQuery({
    queryKey: ["admin-statistics", from, to, page, search],
    queryFn: () =>
      caller({
        url: "/admin/statistics",
        query: {
          from: from || undefined,
          to: to || undefined,
          page,
          limit: 25,
          search,
        },
      }),
  });
  const stats = query.data ?? {};
  const orders = stats.recentOrders ?? [];
  const revenue = stats.revenue ?? 0;
  const pending = stats.pendingOrders ?? 0;
  const lowStock = stats.lowStock ?? 0;
  const metrics = [
    {
      label: "Tiền đã thu",
      value: formatCurrency(stats.collected ?? 0),
      icon: CircleDollarSign,
    },
    {
      label: "Tiền đã hoàn",
      value: formatCurrency(stats.refunded ?? 0),
      icon: CircleDollarSign,
    },
    {
      label: "Doanh thu ròng",
      value: formatCurrency(revenue),
      icon: CircleDollarSign,
    },
    {
      label: "Tổng đơn hàng",
      value: stats.totalOrders ?? 0,
      icon: ShoppingBag,
    },
    {
      label: "Đơn cần xử lý",
      value: pending,
      icon: PackageSearch,
    },
    {
      label: "Sản phẩm",
      value: stats.totalProducts ?? 0,
      icon: Boxes,
    },
    {
      label: "Người dùng",
      value: stats.totalUsers ?? 0,
      icon: Users,
    },
  ];
  const recentOrderColumns = [
    {
      accessorKey: "customerName",
      header: "Khách hàng",
      cell: ({ row }) => (
        <TableIdentity
          title={row.original.customerName || "Khách"}
          description={row.original.customerEmail}
        />
      ),
    },
    {
      id: "detail",
      header: "Chi tiết",
      cell: ({ row }) => (
        <Button variant="outline" onClick={() => setDetailId(row.original.id)}>
          Xem đơn
        </Button>
      ),
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mã đơn" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "orderStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trạng thái" />
      ),
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.orderStatus === "cancelled"
              ? "destructive"
              : "secondary"
          }
        >
          {orderLabels[row.original.orderStatus] ?? row.original.orderStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày tạo" />
      ),
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("vi-VN"),
    },
    {
      accessorKey: "grandTotal",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tổng tiền" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.grandTotal)}
        </span>
      ),
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <Field>
          <FieldLabel
            htmlFor={[fieldIdPrefix, "admin-statistics-4200"].join("-")}
          >
            Từ ngày
          </FieldLabel>
          <Input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            id={[fieldIdPrefix, "admin-statistics-4200"].join("-")}
          />
        </Field>
        <Field>
          <FieldLabel
            htmlFor={[fieldIdPrefix, "admin-statistics-4514"].join("-")}
          >
            Đến ngày
          </FieldLabel>
          <Input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            id={[fieldIdPrefix, "admin-statistics-4514"].join("-")}
          />
        </Field>
      </div>
      <p className="text-sm text-muted-foreground">
        Đơn hàng và doanh thu theo ngày Việt Nam. Doanh thu tính đơn đã thanh
        toán, loại đơn hủy/hoàn trả. Người dùng, sản phẩm và kho là tổng hiện
        tại. Lịch sử được phân trang trên toàn bộ dữ liệu.
      </p>
      {query.isPending && (
        <div role="status">
          <Skeleton className="h-4 w-32" aria-hidden="true" />
          Đang tải thống kê…
        </div>
      )}
      {query.isError && (
        <Alert variant="destructive">
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="flex items-center gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <metric.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">
                  {metric.label}
                </p>
                <p className="truncate text-xl font-semibold">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminOrderDetail id={detailId} onClose={() => setDetailId(null)} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              aria-label="Tìm đơn hoặc khách hàng"
              placeholder="Mã đơn, tên hoặc email khách…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <Pagination className="my-3 flex items-center gap-3 mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Trước
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span>
                    Trang {page} /{" "}
                    {Math.max(1, Math.ceil((stats.historyTotal ?? 0) / 25))}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    disabled={page * 25 >= (stats.historyTotal ?? 0)}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Sau
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <DataTable
              key={page}
              columns={recentOrderColumns}
              data={orders}
              emptyMessage="Chưa có đơn hàng"
              getRowId={(order) => order.id}
              initialPageSize={10}
              search={{
                column: "code",
                placeholder: "Tìm mã đơn…",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cảnh báo vận hành</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">SKU sắp hết hàng</span>
              <Badge variant={lowStock ? "destructive" : "secondary"}>
                {lowStock}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Đơn đang xử lý</span>
              <Badge>{pending}</Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Tổng điểm tồn kho</span>
              <Badge variant="outline">{stats.totalBalances ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
