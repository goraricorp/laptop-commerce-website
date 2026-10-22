import { CatalogForm } from "@/components/form/catalog-form";

export default function Attributes() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Thuộc tính sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý màu sắc, CPU, RAM, dung lượng và giá trị gán cho từng biến
          thể.
        </p>
      </header>
      <CatalogForm
        resources={[
          "attributes",
          "attribute-values",
          "variant-attribute-values",
        ]}
        title="Thuộc tính"
      />
    </div>
  );
}
