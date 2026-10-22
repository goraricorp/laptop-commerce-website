import { CatalogForm } from "@/components/form/catalog-form";

export default function ProductName() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Thông tin sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý tên, danh mục, thương hiệu, loại và trạng thái sản phẩm.
        </p>
      </header>
      <CatalogForm resources={["products"]} title="Sản phẩm" />
    </div>
  );
}
