import PropTypes from "prop-types";
import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import defaultProductImage from "@/assets/image/product/default.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/overview-data";
export function ProductItem({ brand, media, product, variant }) {
  const params = {
    brand: brand?.slug || "webkitlab",
    id: product.id,
    type: product.productType || "other",
  };
  const price = Number(variant?.price) || 0;
  const compareAtPrice = Number(variant?.compareAtPrice) || 0;
  return (
    <Card className="group h-full overflow-hidden gap-0 py-0 transition-shadow hover:shadow-lg">
      <Link
        className="relative block overflow-hidden bg-muted/40"
        params={params}
        to="/product/$type/$brand/$id"
      >
        <img
          alt={media?.alt || product.name}
          className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          src={media?.url || defaultProductImage}
        />
      </Link>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{brand?.name || ""}</span>
        </div>
        <Link
          className="line-clamp-2 h-[2lh] shrink-0 font-semibold leading-snug hover:text-primary"
          params={params}
          to="/product/$type/$brand/$id"
        >
          {product.name}
        </Link>
        {variant?.name ? <p className="text-sm">{variant.name}</p> : null}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.summary || ""}
        </p>
        {typeof product.available === "boolean" ? (
          <p className="text-sm text-muted-foreground">
            {product.available ? "Còn hàng" : "Hiện chưa có hàng khả dụng"}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-end gap-2">
          <span className="text-lg font-bold text-primary">
            {price > 0 ? formatCurrency(price) : "Liên hệ báo giá"}
          </span>
          {price > 0 && compareAtPrice > price ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(compareAtPrice)}
            </span>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          nativeButton={false}
          render={<Link params={params} to="/product/$type/$brand/$id" />}
        >
          <ShoppingCart data-icon="inline-start" />
          Xem sản phẩm
        </Button>
      </CardFooter>
    </Card>
  );
}
ProductItem.propTypes = {
  brand: PropTypes.object,
  media: PropTypes.object,
  product: PropTypes.object,
  variant: PropTypes.object,
};
