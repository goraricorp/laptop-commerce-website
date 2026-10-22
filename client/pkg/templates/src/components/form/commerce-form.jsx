import { CatalogForm } from "@/components/form/catalog-form"
import { ChatForm } from "@/components/form/chat-form"
import { InventoryForm } from "@/components/form/inventory-form"
import { OrderForm } from "@/components/form/order-form"
import { PromotionForm } from "@/components/form/promotion-form"
import { ReviewForm } from "@/components/form/review-form"
import { ShoppingForm } from "@/components/form/shopping-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const groups = [
  ["catalog", "Danh mục", CatalogForm],
  ["inventory", "Tồn kho", InventoryForm],
  ["shopping", "Mua sắm", ShoppingForm],
  ["order", "Đơn hàng", OrderForm],
  ["promotion", "Khuyến mãi", PromotionForm],
  ["review", "Đánh giá", ReviewForm],
  ["chat", "Hội thoại", ChatForm],
]

export function CommerceForm() {
  return (
    <Tabs defaultValue="catalog" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start">
        {groups.map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}
      </TabsList>
      {groups.map(([value, , Component]) => <TabsContent key={value} value={value}><Component /></TabsContent>)}
    </Tabs>
  )
}
