import PropTypes from "prop-types";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils/overview-data";
export function CartItem({
  item,
  onQuantityDelta,
  onRemove,
  onSelectedChange,
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex-row items-start gap-3 p-4">
        <Checkbox
          aria-label={`Chọn ${item.name}`}
          checked={item.selected}
          className="mt-1"
          onCheckedChange={(checked) => onSelectedChange(Boolean(checked))}
        />
        <img
          alt={item.name}
          className="size-16 shrink-0 rounded-md border bg-muted object-contain sm:size-20"
          src={item.image}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-2 font-medium sm:text-base">
              {item.name}
            </h2>
            <Button
              aria-label={`Xoá ${item.name}`}
              className="size-8 shrink-0"
              onClick={onRemove}
              size="icon-sm"
              variant="ghost"
            >
              <Trash2 data-icon="inline-start" />
            </Button>
          </div>
          <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            {item.variantName}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex h-9 items-center rounded-md border">
              <Button
                aria-label="Giảm số lượng"
                className="size-9"
                disabled={item.quantity <= 1}
                onClick={() => onQuantityDelta(-1)}
                size="icon"
                variant="ghost"
              >
                <Minus data-icon="inline-start" />
              </Button>
              <span className="w-9 text-center font-medium">
                {item.quantity}
              </span>
              <Button
                aria-label="Tăng số lượng"
                className="size-9"
                disabled={item.quantity >= 99}
                onClick={() => onQuantityDelta(1)}
                size="icon"
                variant="ghost"
              >
                <Plus data-icon="inline-start" />
              </Button>
            </div>
            <p className="text-base font-semibold">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
CartItem.propTypes = {
  item: PropTypes.object,
  onQuantityDelta: PropTypes.func,
  onRemove: PropTypes.func,
  onSelectedChange: PropTypes.func,
};
