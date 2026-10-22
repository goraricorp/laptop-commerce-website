import { OrderWorkflow } from "@/components/block/order-workflow";
import { FulfillmentOperations } from "@/components/block/order-fulfillment";
import { OrderForm } from "@/components/form/order-form";

export default function Orders() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Quản lý đơn hàng</h1>
        <p className="text-sm text-muted-foreground">
          Xử lý đơn theo quy trình, sau đó quản lý thanh toán, vận chuyển và dữ
          liệu liên quan.
        </p>
      </header>
      <OrderWorkflow />
      <FulfillmentOperations />
      <OrderForm
        resources={[
          "order-items",
          "order-addresses",
          "payments",
          "shipments",
          "order-status-histories",
        ]}
      />
    </div>
  );
}
