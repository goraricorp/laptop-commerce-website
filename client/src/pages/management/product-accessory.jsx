import { CatalogForm } from "@/components/form/catalog-form";

export default function ProductAccessory() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Phụ kiện</h1>
        <p className="text-sm text-muted-foreground">
          Phụ kiện được quản lý trong bảng sản phẩm với loại sản phẩm là phụ
          kiện.
        </p>
      </header>
      <CatalogForm
        resources={["products", "product-variants", "product-media"]}
        title="Sản phẩm phụ kiện"
      />
    </div>
  );
}
