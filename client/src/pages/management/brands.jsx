import { CatalogForm } from "@/components/form/catalog-form";

export default function Brands() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Thương hiệu</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thương hiệu và logo hiển thị trên cửa hàng.
        </p>
      </header>
      <CatalogForm resources={["brands"]} title="Thương hiệu" />
    </div>
  );
}
