import { CatalogForm } from "@/components/form/catalog-form";

export default function Category() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Danh mục sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý cây danh mục, vị trí và trạng thái hiển thị.
        </p>
      </header>
      <CatalogForm resources={["categories"]} title="Danh mục" />
    </div>
  );
}
