import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import PropTypes from "prop-types";
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/overview-data";
export function OrderSummary({
  items,
  subtotal,
  discount = 0,
  shipping = 0,
  title = "Tóm tắt đơn hàng",
  children,
}) {
  const total = Math.max(0, subtotal - discount + shipping);
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {items.length ? (
            items.map((item) => (
              <div className="flex gap-3" key={item.id}>
                {item.image ? (
                  <img
                    alt={item.name}
                    className="size-14 shrink-0 rounded-md border bg-muted object-contain"
                    src={item.image}
                  />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-md bg-muted">
                    <Package className="size-5 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.variantName}
                  </p>
                  <div className="mt-1 flex justify-between gap-3 text-sm">
                    <span>Số lượng: {item.quantity}</span>
                    <strong>
                      {formatCurrency(item.price * item.quantity)}
                    </strong>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>Chưa có sản phẩm được chọn.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          <Separator />
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tạm tính</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Khuyến mãi</dt>
              <dd>-{formatCurrency(discount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phí vận chuyển</dt>
              <dd>{shipping ? formatCurrency(shipping) : "Miễn phí"}</dd>
            </div>
            <Separator />
            <div className="flex justify-between gap-4 text-lg font-semibold">
              <dt>Tổng cộng</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
OrderSummary.propTypes = {
  items: PropTypes.array,
  subtotal: PropTypes.node,
  discount: PropTypes.number,
  shipping: PropTypes.number,
  title: PropTypes.node,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
