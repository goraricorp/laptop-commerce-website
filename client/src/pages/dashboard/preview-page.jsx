import { Link, useNavigate } from "@tanstack/react-router";
import {
  CircleDollarSign,
  Clock3,
  Heart,
  MapPin,
  PackageCheck,
  ReceiptText,
  Star,
  TicketPercent,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";
import {
  DataTable,
  DataTableColumnHeader,
} from "@/components/custom/data-table";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { getOrders } from "@/services/order";
const sampleOrders = [
  {
    id: "DH-20260824-001",
    code: "DH-20260824-001",
    createdAt: "2026-08-24T08:30:00.000Z",
    grandTotal: "26990000",
    orderStatus: "processing",
  },
  {
    id: "DH-20260818-014",
    code: "DH-20260818-014",
    createdAt: "2026-08-18T13:15:00.000Z",
    grandTotal: "3190000",
    orderStatus: "completed",
  },
  {
    id: "DH-20260805-008",
    code: "DH-20260805-008",
    createdAt: "2026-08-05T02:45:00.000Z",
    grandTotal: "1290000",
    orderStatus: "cancelled",
  },
];
const statusLabel = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  returned: "Đã hoàn trả",
};
const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));
const date = (value) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export default function PreviewPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const ordersQuery = getOrders({
    limit: 50,
  });
  const orders = ordersQuery.data?.items?.length
    ? ordersQuery.data.items
    : sampleOrders;
  const columns = useMemo(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Mã đơn" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">#{row.original.code}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ngày đặt" />
        ),
        cell: ({ row }) => date(row.original.createdAt),
      },
      {
        accessorKey: "grandTotal",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tổng tiền" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold">
            {money(row.original.grandTotal)}
          </span>
        ),
      },
      {
        accessorKey: "orderStatus",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.orderStatus === "cancelled"
                ? "destructive"
                : "secondary"
            }
          >
            {statusLabel[row.original.orderStatus] ?? row.original.orderStatus}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 96,
        cell: ({ row }) => (
          <Button
            onClick={(event) => {
              event.stopPropagation();
              navigate({
                to: "/user/bill",
                search: {
                  id: row.original.id,
                },
              });
            }}
            size="sm"
            variant="ghost"
          >
            Chi tiết
          </Button>
        ),
      },
    ],
    [navigate],
  );
  const name = user?.name || user?.username || "Khách hàng Webkitlab";
  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-20 rounded-xl">
              <AvatarImage alt={name} src={user?.image} />
              <AvatarFallback className="rounded-xl text-xl">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Xin chào,</p>
              <h1 className="text-2xl font-semibold">{name}</h1>
              <p className="text-sm text-muted-foreground">
                Quản lý hồ sơ, đơn hàng và ưu đãi của bạn.
              </p>
            </div>
          </div>
          <Button nativeButton={false} render={<Link to="/user/profile" />}>
            <UserRound data-icon="inline-start" />
            Cập nhật hồ sơ
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: ReceiptText,
            label: "Tổng đơn hàng",
            value: orders.length,
            note: "Tất cả đơn đã đặt",
          },
          {
            icon: Clock3,
            label: "Đang xử lý",
            value: orders.filter((item) =>
              ["pending", "confirmed", "processing"].includes(item.orderStatus),
            ).length,
            note: "Đơn đang được chuẩn bị",
          },
          {
            icon: CircleDollarSign,
            label: "Tổng chi tiêu",
            value: money(
              orders.reduce(
                (sum, item) => sum + Number(item.grandTotal || 0),
                0,
              ),
            ),
            note: "Giá trị đơn hiện có",
          },
          {
            icon: Star,
            label: "Điểm thành viên",
            value: "1.840",
            note: "Hạng thành viên Bạc",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-xl font-semibold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: PackageCheck,
            title: "Đơn hàng",
            value: `${orders.length} đơn`,
            note: "Theo dõi quá trình giao hàng",
            to: "/user/order",
          },
          {
            icon: MapPin,
            title: "Sổ địa chỉ",
            value: "3 địa chỉ",
            note: "Địa chỉ giao và nhận hàng",
            to: "/user/address",
          },
          {
            icon: Heart,
            title: "Yêu thích",
            value: "15 sản phẩm",
            note: "Nhận báo giá khi có ưu đãi",
            to: "/product/laptop",
          },
          {
            icon: TicketPercent,
            title: "Kho voucher",
            value: "21 mã",
            note: "Dùng cho lần mua tiếp theo",
            to: "/user/voucher",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <span className="grid size-9 place-items-center rounded-md bg-muted">
                <item.icon className="size-4" />
              </span>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.note}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <strong>{item.value}</strong>
              <Button
                nativeButton={false}
                render={<Link to={item.to} />}
                size="sm"
                variant="outline"
              >
                Xem
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <section className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Đơn hàng gần đây</h2>
            {ordersQuery.isLoading ? <Spinner className="size-4" /> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Theo dõi các giao dịch mới nhất của tài khoản.
          </p>
        </div>
        <DataTable
          columns={columns}
          data={orders}
          emptyMessage="Bạn chưa có đơn hàng nào."
          getRowId={(row) => row.id}
          initialPageSize={10}
          onRowClick={(row) =>
            navigate({
              to: "/user/bill",
              search: {
                id: row.id,
              },
            })
          }
          search={{
            column: "code",
            placeholder: "Tìm theo mã đơn…",
          }}
        />
      </section>
    </div>
  );
}
