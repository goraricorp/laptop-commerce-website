import { ResourceForm } from "@/components/form/resource-form";
import { reviewSchemas } from "@/schemas/review";
import { reviewServices } from "@/services/review";

export function ReviewForm() {
  return (
    <ResourceForm
      title="Đánh giá"
      description="Kiểm duyệt đánh giá sản phẩm và trạng thái hiển thị."
      disableCreateResources={["product-reviews"]}
      schemas={{ "product-reviews": reviewSchemas["product-review"] }}
      services={reviewServices}
    />
  );
}
