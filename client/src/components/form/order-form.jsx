import PropTypes from "prop-types";
import { ResourceForm } from "@/components/form/resource-form";
import { orderSchemas } from "@/schemas/order";
import { orderServices } from "@/services/order";
const schemas = {
  orders: orderSchemas["sales-order"],
  "order-items": orderSchemas["sales-order-item"],
  "order-addresses": orderSchemas["order-address"],
  payments: orderSchemas.payment,
  shipments: orderSchemas.shipment,
  "order-status-histories": orderSchemas["order-status-history"],
};
export function OrderForm({ resources }) {
  return (
    <ResourceForm
      title="Đơn hàng"
      description="Quản lý đơn bán, thanh toán, vận chuyển và lịch sử trạng thái."
      readOnlyResources={["order-status-histories", "payments", "shipments"]}
      resources={resources}
      schemas={schemas}
      services={orderServices}
    />
  );
}
OrderForm.propTypes = {
  resources: PropTypes.array,
};
