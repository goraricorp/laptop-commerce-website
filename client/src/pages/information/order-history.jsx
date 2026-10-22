import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NativeSelectOption,
  NativeSelect,
} from "@/components/ui/native-select";
import { FieldGroup, FieldLabel, Field } from "@/components/ui/field";
import PropTypes from "prop-types";
import { useState, useId } from "react";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Clock3,
  PackageCheck,
  RotateCcw,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCustomerOrders } from "@/services/checkout";
import { orderStatusLabel } from "@/lib/checkout/order-status";
import { useUser } from "@/hooks/use-user";
const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));
function OrderCard({ order }) {
  const Icon =
    order.orderStatus === "completed"
      ? PackageCheck
      : order.orderStatus === "cancelled"
        ? RotateCcw
        : order.fulfillmentStatus === "shipped"
          ? Truck
          : Clock3;
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Đơn #{order.code}</p>
              <p className="text-xs text-muted-foreground">
                Đặt ngày {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
          <Badge
            variant={
              order.orderStatus === "cancelled" ? "destructive" : "secondary"
            }
          >
            {orderStatusLabel(order)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {order.itemCount ?? 0} sản phẩm
            </p>
            <p className="text-sm">
              Thanh toán:{" "}
              {{
                paid: "Đã thanh toán",
                partially_refunded: "Đã hoàn tiền một phần",
                refunded: "Đã hoàn toàn bộ tiền",
              }[order.paymentStatus] ?? "Chờ thanh toán"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tổng tiền</p>
            <strong className="text-lg">{money(order.grandTotal)}</strong>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            nativeButton={false}
            render={
              <Link
                search={{
                  orderId: order.id,
                }}
                to="/purchase"
              />
            }
            variant="outline"
          >
            Xem chi tiết
            <ChevronRight data-icon="inline-start" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
export function OrderHistory() {
  const fieldIdPrefix = useId();
  const { user } = useUser();
  const [group, setGroup] = useState("all"),
    [q, setQ] = useState(""),
    [sort, setSort] = useState("newest");
  const query = useCustomerOrders(user?.id, {
    q,
    group,
    sort,
    limit: 25,
  });
  if (!user)
    return (
      <p>
        Vui lòng <Link to="/auth/sign-in">đăng nhập</Link> để xem đơn hàng.
      </p>
    );
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Lịch sử đơn hàng</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setQ(new FormData(event.currentTarget).get("q"));
        }}
      >
        <FieldGroup className="flex flex-wrap gap-3">
          <Input
            className="sm:max-w-sm"
            name="q"
            aria-label="Tìm đơn hàng"
            placeholder="Mã đơn, tên sản phẩm hoặc SKU…"
            defaultValue={q}
          />
          <Button type="submit">Tìm</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void query.refresh()}
          >
            Làm mới
          </Button>
        </FieldGroup>
      </form>
      <div className="flex flex-wrap gap-2" aria-label="Trạng thái đơn hàng">
        {Object.entries({
          all: "Tất cả",
          processing: "Đang xử lý",
          awaitingDelivery: "Đã thanh toán / Chờ giao",
          completed: "Hoàn thành",
          cancelled: "Đã hủy / Hoàn trả",
        }).map(([value, label]) => (
          <Button
            key={value}
            variant={group === value ? "default" : "outline"}
            aria-pressed={group === value}
            onClick={() => setGroup(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <Field>
        <FieldLabel htmlFor={[fieldIdPrefix, "order-history-4866"].join("-")}>
          Sắp xếp{" "}
        </FieldLabel>
        <NativeSelect
          aria-label="Thứ tự đơn hàng"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="w-full"
          id={[fieldIdPrefix, "order-history-4866"].join("-")}
        >
          <NativeSelectOption value="newest">Mới nhất</NativeSelectOption>
          <NativeSelectOption value="oldest">Cũ nhất</NativeSelectOption>
        </NativeSelect>
      </Field>
      {query.isPending ? (
        <div role="status">
          <Skeleton className="h-4 w-32" aria-hidden="true" />
          Đang tải đơn hàng…
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      ) : (
        <>
          <p>{query.data.total} đơn hàng theo bộ lọc</p>
          {query.data.items.length ? (
            query.data.items.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <p>Không có đơn hàng phù hợp.</p>
          )}
        </>
      )}
      <Pagination
        aria-label="Phân trang đơn hàng"
        className="flex items-center gap-3 mx-0 w-auto"
      >
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              disabled={query.page <= 1 || query.isFetching}
              onClick={query.previous}
            >
              Trang trước
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span>Trang {query.page}</span>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="outline"
              disabled={!query.data?.hasMore || query.isFetching}
              onClick={query.next}
            >
              Trang sau
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
OrderCard.propTypes = {
  order: PropTypes.object,
};
