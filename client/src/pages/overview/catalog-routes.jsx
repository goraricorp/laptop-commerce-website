import { useParams } from "@tanstack/react-router";
import ProductPage from "./product-page";
import ProductList from "./product-list";
export function ProductDetailsRoute() {
  const { id } = useParams({ strict: false });
  return <ProductPage key={id} />;
}
export function ProductTypeRoute() {
  const { type } = useParams({ strict: false });
  return <ProductList key={type} />;
}
