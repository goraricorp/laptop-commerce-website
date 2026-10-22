import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Gift,
  ShoppingCart,
  TicketPercent,
} from "lucide-react";
import { CartItem } from "@/components/product/cart-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/cart-context";
import { formatCurrency } from "@/lib/utils/overview-data";
export default function CartList() {
  const {
    items,
    syncing,
    removeItem,
    selectAll,
    selectedItems,
    selectedTotal,
    toggleItem,
    changeQuantity,
  } = useCart();
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Giỏ hàng</h1>
      {syncing && (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          đồng bộ giỏ hàng…
        </div>
      )}

      {items.length ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <section className="flex min-w-0 flex-col gap-6">
            <Card className="gap-0 py-0">
              <CardContent className="flex-row items-center gap-3 p-4">
                <Checkbox
                  aria-label="Chọn tất cả sản phẩm"
                  checked={allSelected}
                  onCheckedChange={(checked) => selectAll(Boolean(checked))}
                />
                <span className="font-medium">
                  Chọn tất cả ({selectedItems.length}/{items.length})
                </span>
              </CardContent>
            </Card>

            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQuantityDelta={(delta) => changeQuantity(item.id, delta)}
                onRemove={() => removeItem(item.id)}
                onSelectedChange={(selected) => toggleItem(item.id, selected)}
              />
            ))}
          </section>

          <Card className="sticky top-32 gap-0 py-0">
            <CardContent className="gap-3 p-4">
              {selectedItems.length && !syncing ? (
                <Button
                  className="w-full justify-between rounded-full"
                  nativeButton={false}
                  render={<Link to="/purchase" />}
                >
                  Tiếp tục
                  <ArrowRight data-icon="inline-start" />
                </Button>
              ) : (
                <Button
                  className="w-full justify-between rounded-full"
                  disabled
                >
                  Tiếp tục
                  <ArrowRight data-icon="inline-start" />
                </Button>
              )}
              <Separator />
              <Button
                className="h-11 w-full justify-start rounded-lg"
                variant="outline"
              >
                <Gift data-icon="inline-start" />
                Quà tặng (0)
                <ChevronRight
                  className="ml-auto text-muted-foreground"
                  data-icon="inline-start"
                />
              </Button>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <TicketPercent className="size-4" />
                Nhập mã khuyến mãi ở bước thông tin nhận hàng.
              </p>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Tổng tiền</dt>
                  <dd>{formatCurrency(selectedTotal)}</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Tổng khuyến mãi</dt>
                  <dd>−{formatCurrency(0)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Phí vận chuyển</dt>
                  <dd>Miễn phí</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Tạm tính</dt>
                  <dd className="text-xl font-semibold">
                    {formatCurrency(selectedTotal)}
                  </dd>
                </div>
              </dl>
              <Button className="mx-auto" variant="ghost">
                Xem chi tiết
                <ChevronDown data-icon="inline-start" />
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingCart />
                </EmptyMedia>
                <EmptyTitle>Giỏ hàng của bạn đang trống</EmptyTitle>
                <EmptyDescription>
                  Khám phá các sản phẩm công nghệ phù hợp với bạn.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      params={{
                        type: "all",
                      }}
                      to="/product/$type"
                    />
                  }
                >
                  Tiếp tục mua sắm
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
