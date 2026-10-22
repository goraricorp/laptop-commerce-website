import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/cart-context";
import { formatCurrency } from "@/lib/utils/overview-data";
export function Cart() {
  const [open, setOpen] = useState(false);
  const { count, items, removeItem, changeQuantity } = useCart();
  return (
    <>
      <Button
        aria-label={`Giỏ hàng, ${count} sản phẩm`}
        className="relative size-9 rounded-md"
        onClick={() => setOpen(true)}
        size="icon"
        variant="ghost"
      >
        <ShoppingCart data-icon="inline-start" />
        {count ? (
          <Badge className="absolute -right-1 -top-1 min-w-4 px-1">
            {count > 99 ? "99+" : count}
          </Badge>
        ) : null}
      </Button>

      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent className="w-[calc(100%-1rem)] gap-0 sm:max-w-[30rem]">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="text-xl font-semibold">Giỏ hàng</SheetTitle>
            <SheetDescription className="sr-only">
              Danh sách sản phẩm đã thêm vào giỏ hàng
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-4 p-4">
              {items.length ? (
                items.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-2xl border p-4"
                  >
                    <img
                      alt={item.name}
                      className="size-16 shrink-0 rounded-md bg-muted object-contain"
                      src={item.image}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 font-medium">
                            {item.name}
                          </h3>
                          <p className="font-semibold">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <Button
                          aria-label={`Xoá ${item.name}`}
                          className="size-8 shrink-0"
                          onClick={() => removeItem(item.id)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Trash2 data-icon="inline-start" />
                        </Button>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        <Check />
                        Đã thêm vào giỏ
                      </Badge>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">
                          Số lượng: {item.quantity}
                        </span>
                        <div className="flex h-8 items-center rounded-md border">
                          <Button
                            aria-label="Giảm số lượng"
                            disabled={item.quantity <= 1}
                            className="size-8"
                            onClick={() => changeQuantity(item.id, -1)}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Minus data-icon="inline-start" />
                          </Button>
                          <span className="w-7 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            aria-label="Tăng số lượng"
                            disabled={item.quantity >= 99}
                            className="size-8"
                            onClick={() => changeQuantity(item.id, 1)}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Plus data-icon="inline-start" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShoppingCart />
                    </EmptyMedia>
                    <EmptyTitle>Giỏ hàng đang trống</EmptyTitle>
                    <EmptyDescription>
                      Hãy chọn sản phẩm phù hợp để bắt đầu mua sắm.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </ScrollArea>

          <SheetFooter className="border-t p-4 gap-4">
            <Button
              className="w-full"
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Tiếp tục mua sắm
            </Button>
            <Button
              className="w-full"
              disabled={!items.length}
              nativeButton={false}
              onClick={() => setOpen(false)}
              render={<Link to="/cart" />}
            >
              Đến giỏ hàng
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
