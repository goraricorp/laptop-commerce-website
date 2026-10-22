import { CatalogForm } from "@/components/form/catalog-form";

export default function ProductConfiguration() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Biến thể và cấu hình</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý SKU, giá bán, giá vốn và cấu hình của từng biến thể.
        </p>
      </header>
      <CatalogForm
        resources={["product-variants", "variant-attribute-values"]}
        title="Biến thể sản phẩm"
      />
    </div>
  );
}
