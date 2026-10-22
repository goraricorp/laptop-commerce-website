import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PropTypes from "prop-types";
import { OrderFulfillment } from "@/components/block/order-fulfillment";
import { useQuery } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/overview-data";
export function AdminOrderDetail({ id, onClose }) {
  const query = useQuery({
    queryKey: ["admin-order-detail", id],
    enabled: Boolean(id),
    queryFn: () =>
      caller({
        url: `/admin/statistics/orders/${id}`,
      }),
  });
  const order = query.data;
  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn {order?.code}</DialogTitle>
        </DialogHeader>
        {query.isPending ? (
          <div role="status">
            <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>
            Đang tải…
          </div>
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{query.error.message}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4">
            <p>
              {order.customerName ?? "Khách"} ·{" "}
              {order.customerEmail ?? order.guestEmail}
            </p>
            <p>
              {order.orderStatus} · {order.paymentStatus}
            </p>
            {order.addresses.map((address) => (
              <p key={address.id}>
                {address.recipientName} · {address.phone}
                <br />
                {[
                  address.addressLine,
                  address.ward,
                  address.district,
                  address.province,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ))}
            <h3 className="font-semibold">Sản phẩm</h3>
            {order.items.map((item) => (
              <p key={item.id}>
                {item.productName} · {item.variantName} · {item.quantity} ×{" "}
                {formatCurrency(item.unitPrice)} = {formatCurrency(item.total)}
              </p>
            ))}
            <p>
              Tạm tính: {formatCurrency(order.subtotal)}
              <br />
              Giảm giá: {formatCurrency(order.discountTotal)}
              <br />
              Giao hàng: {formatCurrency(order.shippingTotal)}
              <br />
              <strong>Tổng: {formatCurrency(order.grandTotal)}</strong>
            </p>
            <p>Ghi chú: {order.note || "—"}</p>
            <h3 className="font-semibold">Thanh toán</h3>
            {order.payments.map((payment, i) => (
              <p key={i}>
                {payment.provider} · {payment.status} ·{" "}
                {formatCurrency(payment.amount)}
              </p>
            ))}
            <h3 className="font-semibold">Vận chuyển</h3>
            {order.shipments.map((shipment) => (
              <p key={shipment.id}>
                {shipment.carrier} · {shipment.trackingNumber} ·{" "}
                {shipment.status}
              </p>
            ))}
            <OrderFulfillment orderId={id} admin />
            <h3 className="font-semibold">Lịch sử</h3>
            {order.history.map((event) => (
              <p key={event.id}>
                {new Date(event.createdAt).toLocaleString("vi-VN")} ·{" "}
                {event.status} · {event.note}
              </p>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
AdminOrderDetail.propTypes = {
  id: PropTypes.string,
  onClose: PropTypes.func,
};
