import { CatalogForm } from "@/components/form/catalog-form";

export default function Products() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Quản lý sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin chung, biến thể, SKU, nội dung, hình ảnh và thuộc
          tính sản phẩm.
        </p>
      </header>
      <CatalogForm
        resources={[
          "products",
          "product-variants",
          "product-media",
          "product-content-sections",
          "attributes",
          "attribute-values",
          "variant-attribute-values",
          "campaigns",
        ]}
        title="Dữ liệu sản phẩm"
      />
    </div>
  );
}
