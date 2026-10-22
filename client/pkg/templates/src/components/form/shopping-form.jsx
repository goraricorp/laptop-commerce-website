import { ResourceForm } from "@/components/form/resource-form"
import { shoppingSchemas } from "@/schemas/shopping"
import { shoppingServices } from "@/services/shopping"

const schemas = { addresses: shoppingSchemas.address, carts: shoppingSchemas.cart, "cart-items": shoppingSchemas["cart-item"] }

export function ShoppingForm() {
  return (
    <ResourceForm
      title="Mua sắm"
      description="Quản lý địa chỉ, giỏ hàng khách và sản phẩm trong giỏ."
      schemas={schemas}
      services={shoppingServices}
    />
  )
}
