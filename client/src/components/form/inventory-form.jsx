import { ResourceForm } from "@/components/form/resource-form";
import { inventorySchemas } from "@/schemas/inventory";
import { inventoryServices } from "@/services/inventory";

const schemas = {
  "inventory-locations": inventorySchemas["inventory-location"],
  "inventory-balances": inventorySchemas["inventory-balance"],
  "stock-movements": inventorySchemas["stock-movement"],
};
const editableFields = { "inventory-balances": ["reorderLevel"] };

export function InventoryForm() {
  return (
    <ResourceForm
      title="Tồn kho"
      description="Quản lý chi nhánh, số lượng tồn và lịch sử biến động kho."
      schemas={schemas}
      services={inventoryServices}
      createOnlyResources={["stock-movements"]}
      disableCreateResources={["inventory-balances"]}
      disableDeleteResources={["inventory-balances"]}
      editableFields={editableFields}
      resourceIds={{
        "inventory-balances": (row) => `${row.locationId}:${row.variantId}`,
      }}
    />
  );
}
