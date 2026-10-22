import { CatalogForm } from "@/components/form/catalog-form";

export default function ProductColor() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Màu sắc và thuộc tính</h1>
        <p className="text-sm text-muted-foreground">
          Màu sắc được quản lý như một thuộc tính động của sản phẩm.
        </p>
      </header>
      <CatalogForm
        resources={[
          "attributes",
          "attribute-values",
          "variant-attribute-values",
        ]}
        title="Thuộc tính sản phẩm"
      />
    </div>
  );
}
