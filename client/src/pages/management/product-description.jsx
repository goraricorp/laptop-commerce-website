import { CatalogForm } from "@/components/form/catalog-form";

export default function ProductDescription() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Nội dung sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý hình ảnh, video và các phần nội dung mô tả chi tiết.
        </p>
      </header>
      <CatalogForm
        resources={["product-media", "product-content-sections"]}
        title="Nội dung và hình ảnh"
      />
    </div>
  );
}
