import PropTypes from "prop-types";
import { ProductItem } from "@/components/product/product-item";
export function ProductCard({ brand, media, product, variant }) {
  return (
    <ProductItem
      brand={brand}
      media={media}
      product={product}
      variant={variant}
    />
  );
}
ProductCard.propTypes = {
  brand: PropTypes.object,
  media: PropTypes.object,
  product: PropTypes.object,
  variant: PropTypes.object,
};
