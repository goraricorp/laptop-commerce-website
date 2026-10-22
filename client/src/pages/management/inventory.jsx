import { InventoryForm } from "@/components/form/inventory-form";

export default function Inventory() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Tồn kho nhiều chi nhánh</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý kho, mức tồn và ghi nhận nhập, xuất, giữ chỗ hoặc hoàn hàng
          bằng sổ biến động bất biến.
        </p>
      </header>
      <InventoryForm />
    </div>
  );
}
