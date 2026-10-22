import { useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { CheckoutOrderPanel } from "@/components/product/checkout-order-panel";

export function OrderDetails() {
  const { id } = useSearch({ strict: false });
  return z.uuid().safeParse(id).success ? (
    <CheckoutOrderPanel orderId={id} />
  ) : (
    <p>Vui lòng chọn đơn hàng từ lịch sử mua hàng.</p>
  );
}
