import { ResourceForm } from "@/components/form/resource-form";
import { promotionSchemas } from "@/schemas/promotion";
import { promotionServices } from "@/services/promotion";

const schemas = {
  promotions: promotionSchemas.promotion,
  "promotion-codes": promotionSchemas["promotion-code"],
  "promotion-usages": promotionSchemas["promotion-usage"],
};

export function PromotionForm() {
  return (
    <ResourceForm
      title="Khuyến mãi"
      description="Quản lý chương trình, mã khuyến mãi và lượt sử dụng."
      readOnlyResources={["promotion-usages"]}
      schemas={schemas}
      services={promotionServices}
    />
  );
}
