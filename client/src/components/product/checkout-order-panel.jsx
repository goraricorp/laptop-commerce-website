import { Skeleton } from "@/components/ui/skeleton";
import PropTypes from "prop-types";
import { OrderFulfillment } from "@/components/block/order-fulfillment";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrderSummary } from "@/components/product/order-summary";
import { useUser } from "@/hooks/use-user";
import { useCart } from "@/hooks/cart-context";
import { checkoutApi } from "@/services/checkout";
import {
  isAwaitingDelivery,
  orderStatusLabel,
} from "@/lib/checkout/order-status";
import { paymentLabels } from "@/lib/checkout/wizard";
import { formatAddress } from "@/hooks/use-address-book";
export function CheckoutOrderPanel({ orderId, initialError = "" }) {
  const { user } = useUser();
  const { refreshCart } = useCart();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const key = ["my-order", user?.id, orderId];
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: () => checkoutApi.order(orderId),
  });
  const order = query.data;
  const hasOrder = Boolean(order);
  const provider = order?.payment.provider;
  const managed = order?.managed !== false;
  const terminal = ["paid", "paid_late", "failed", "cancelled"].includes(
    order?.payment.state,
  );
  useEffect(() => {
    if (!user || !hasOrder || !managed || provider === "cod" || terminal)
      return;
    let alive = true,
      pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const data = await checkoutApi.refresh(orderId);
        if (alive) {
          client.setQueryData(["my-order", user.id, orderId], data);
        }
      } catch (cause) {
        if (alive) setError(cause.message);
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [user, orderId, provider, hasOrder, terminal, managed, client]);
  useEffect(() => {
    if (user?.id && order?.paymentStatus === "paid") {
      void client.invalidateQueries({
        queryKey: ["my-orders", user.id],
      });
    }
  }, [client, user?.id, order?.paymentStatus]);
  const cartSettled =
    hasOrder &&
    managed &&
    (order.paymentStatus === "paid" || provider === "cod");
  useEffect(() => {
    if (cartSettled) refreshCart();
  }, [cartSettled, orderId, refreshCart]);
  async function act(action) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await checkoutApi[action](orderId);
      client.setQueryData(key, data);
      if (action === "pay" && data.payment.url) {
        const url = new URL(data.payment.url);
        if (url.protocol !== "https:")
          throw new Error("URL thanh toán không hợp lệ.");
        window.location.assign(url.href);
      }
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  if (!user)
    return (
      <p>
        Vui lòng{" "}
        <Link className="underline" to="/auth/sign-in">
          đăng nhập
        </Link>{" "}
        để xem đơn hàng.
      </p>
    );
  if (query.isPending)
    return (
      <div role="status">
        <Skeleton className="h-4 w-32" aria-hidden="true" />
        Đang tải đơn hàng…
      </div>
    );
  if (query.isError)
    return (
      <Alert>
        <AlertTitle>Không thể tải đơn hàng</AlertTitle>
        <AlertDescription>{query.error.message}</AlertDescription>
      </Alert>
    );
  const closed =
    ["cancelled", "failed"].includes(order.payment.state) ||
    order.orderStatus === "cancelled";
  const paid = ["paid", "partially_refunded", "refunded"].includes(
    order.paymentStatus,
  );
  const summaryItems = order.items.map((item) => ({
    ...item,
    id: item.id,
    name: item.productName,
    price: Number(item.unitPrice),
  }));
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Đơn hàng #{order.code}</h1>
        <p className="mt-2 text-muted-foreground">
          {order.payment.requiresSupport
            ? "Đã ghi nhận thanh toán đến muộn sau khi đơn đã đóng. Vui lòng liên hệ hỗ trợ để đối soát hoàn tiền."
            : paid
              ? isAwaitingDelivery(order)
                ? orderStatusLabel(order)
                : order.orderStatus === "completed"
                  ? "Hoàn thành. Đơn hàng đã được giao."
                  : "Thanh toán đã được xác nhận."
              : closed
                ? "Đơn hàng đã đóng."
                : order.payment.provider === "cod"
                  ? "Đã đặt hàng. Thanh toán khi nhận hàng."
                  : "Đơn hàng đã được tạo, đang chờ thanh toán."}
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin nhận hàng</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <strong>{order.address?.recipientName}</strong>
              <p>{order.address?.phone}</p>
              <p>{order.address && formatAddress(order.address)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {paymentLabels[order.payment.provider] ?? "Thanh toán đơn hàng"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>
                {{
                  paid: "Đã thanh toán",
                  partially_refunded: "Đã hoàn tiền một phần",
                  refunded: "Đã hoàn toàn bộ tiền",
                }[order.paymentStatus] ?? "Chưa thanh toán"}
              </p>
              {order.payment.provider === "paypal" && (
                <p>
                  Thanh toán {order.payment.amount} USD · Tỷ giá{" "}
                  {Number(order.payment.exchangeRate).toLocaleString("vi-VN")}{" "}
                  VND/USD
                </p>
              )}
              {managed &&
                !closed &&
                !paid &&
                order.payment.provider !== "cod" && (
                  <Button disabled={busy} onClick={() => act("pay")}>
                    {busy
                      ? "Đang xử lý…"
                      : order.payment.url
                        ? "Tiếp tục thanh toán"
                        : "Thanh toán ngay"}
                  </Button>
                )}
              {managed && !closed && !paid && (
                <div className="flex flex-wrap gap-3">
                  {order.payment.provider !== "cod" && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => act("refresh")}
                    >
                      Kiểm tra thanh toán
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => act("cancel")}
                  >
                    Hủy đơn
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <OrderFulfillment orderId={orderId} />
          <div className="flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link to="/user/order" />}>
              Đơn hàng của tôi
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/cart" />}
            >
              Về giỏ hàng
            </Button>
          </div>
        </div>
        <OrderSummary
          items={summaryItems}
          subtotal={Number(order.subtotal)}
          shipping={Number(order.shippingTotal)}
          discount={Number(order.discountTotal)}
        />
      </div>
    </div>
  );
}
CheckoutOrderPanel.propTypes = {
  orderId: PropTypes.node,
  initialError: PropTypes.string,
};
