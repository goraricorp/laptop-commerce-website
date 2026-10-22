import { adminSchemas } from "@/schemas/admin";
import { catalogSchemas } from "@/schemas/catalog";
import { chatSchemas } from "@/schemas/chat";
import { inventorySchemas } from "@/schemas/inventory";
import { orderSchemas } from "@/schemas/order";
import { promotionSchemas } from "@/schemas/promotion";
import { reviewSchemas } from "@/schemas/review";
import { shoppingSchemas } from "@/schemas/shopping";
import { adminServices } from "@/services/admin";
import { catalogServices } from "@/services/catalog";
import { chatServices } from "@/services/chat";
import { inventoryServices } from "@/services/inventory";
import { orderServices } from "@/services/order";
import { promotionServices } from "@/services/promotion";
import { reviewServices } from "@/services/review";
import { shoppingServices } from "@/services/shopping";

export const adminResourceLabels = {
  campaigns: "Campaign và banner",
  accounts: "Tài khoản đăng nhập",
  addresses: "Địa chỉ",
  attributes: "Thuộc tính",
  "attribute-values": "Giá trị thuộc tính",
  brands: "Thương hiệu",
  "cart-items": "Sản phẩm trong giỏ",
  carts: "Giỏ hàng",
  categories: "Danh mục",
  "conversation-participants": "Người tham gia",
  conversations: "Cuộc hội thoại",
  "inventory-balances": "Tồn kho",
  "inventory-locations": "Chi nhánh và kho",
  "message-attachments": "Tệp đính kèm",
  messages: "Tin nhắn",
  "order-addresses": "Địa chỉ đơn hàng",
  "order-items": "Sản phẩm trong đơn",
  "order-status-histories": "Lịch sử trạng thái",
  orders: "Đơn hàng",
  payments: "Thanh toán",
  "product-content-sections": "Nội dung sản phẩm",
  "product-media": "Hình ảnh và video",
  "product-reviews": "Đánh giá",
  "product-variants": "Biến thể và SKU",
  products: "Sản phẩm",
  "promotion-codes": "Mã khuyến mãi",
  "promotion-usages": "Lượt sử dụng",
  promotions: "Khuyến mãi",
  sessions: "Phiên đăng nhập",
  shipments: "Vận chuyển",
  "stock-movements": "Biến động kho",
  users: "Người dùng",
  "variant-attribute-values": "Thuộc tính biến thể",
  verifications: "Mã xác thực",
};

const definitions = {
  campaigns: [catalogServices.campaigns, catalogSchemas.campaign],
  categories: [catalogServices.categories, catalogSchemas.category],
  brands: [catalogServices.brands, catalogSchemas.brand],
  products: [catalogServices.products, catalogSchemas.product],
  "product-variants": [
    catalogServices["product-variants"],
    catalogSchemas["product-variant"],
  ],
  attributes: [catalogServices.attributes, catalogSchemas.attribute],
  "attribute-values": [
    catalogServices["attribute-values"],
    catalogSchemas["attribute-value"],
  ],
  "variant-attribute-values": [
    catalogServices["variant-attribute-values"],
    catalogSchemas["variant-attribute-value"],
  ],
  "product-media": [
    catalogServices["product-media"],
    catalogSchemas["product-media"],
  ],
  "product-content-sections": [
    catalogServices["product-content-sections"],
    catalogSchemas["product-content-section"],
  ],
  "inventory-locations": [
    inventoryServices["inventory-locations"],
    inventorySchemas["inventory-location"],
  ],
  "inventory-balances": [
    inventoryServices["inventory-balances"],
    inventorySchemas["inventory-balance"],
    {
      disableCreate: true,
      disableDelete: true,
      editableFields: ["reorderLevel"],
    },
  ],
  "stock-movements": [
    inventoryServices["stock-movements"],
    inventorySchemas["stock-movement"],
    { createOnly: true },
  ],
  orders: [orderServices.orders, orderSchemas["sales-order"]],
  "order-items": [
    orderServices["order-items"],
    orderSchemas["sales-order-item"],
  ],
  "order-addresses": [
    orderServices["order-addresses"],
    orderSchemas["order-address"],
  ],
  payments: [orderServices.payments, orderSchemas.payment, { readOnly: true }],
  shipments: [
    orderServices.shipments,
    orderSchemas.shipment,
    { readOnly: true },
  ],
  "order-status-histories": [
    orderServices["order-status-histories"],
    orderSchemas["order-status-history"],
    { readOnly: true },
  ],
  promotions: [promotionServices.promotions, promotionSchemas.promotion],
  "promotion-codes": [
    promotionServices["promotion-codes"],
    promotionSchemas["promotion-code"],
  ],
  "promotion-usages": [
    promotionServices["promotion-usages"],
    promotionSchemas["promotion-usage"],
    { readOnly: true },
  ],
  "product-reviews": [
    reviewServices["product-reviews"],
    reviewSchemas["product-review"],
    {
      disableCreate: true,
      editableFields: ["status", "score", "title", "comment"],
    },
  ],
  conversations: [
    chatServices.conversations,
    chatSchemas.conversation,
    { readOnly: true },
  ],
  "conversation-participants": [
    chatServices["conversation-participants"],
    chatSchemas["conversation-participant"],
    { readOnly: true },
  ],
  messages: [chatServices.messages, chatSchemas.message, { readOnly: true }],
  "message-attachments": [
    chatServices["message-attachments"],
    chatSchemas["message-attachment"],
    { readOnly: true },
  ],
  users: [
    adminServices.users,
    adminSchemas.user,
    { disableCreate: true, disableDelete: true },
  ],
  addresses: [shoppingServices.addresses, shoppingSchemas.address],
  carts: [shoppingServices.carts, shoppingSchemas.cart],
  "cart-items": [shoppingServices["cart-items"], shoppingSchemas["cart-item"]],
};

export const adminResources = Object.fromEntries(
  Object.entries(definitions).map(([name, [service, schema, options = {}]]) => [
    name,
    {
      name,
      label: adminResourceLabels[name] ?? name,
      service,
      schema,
      ...options,
    },
  ]),
);

export const defaultResourceBySection = {
  attributes: "attributes",
  brands: "brands",
  categories: "categories",
  chat: "conversations",
  inventory: "inventory-locations",
  orders: "order-items",
  products: "products",
  promotions: "promotions",
  reviews: "product-reviews",
  users: "users",
  voucher: "promotions",
  accessory: "products",
  color: "attributes",
  configuration: "product-variants",
  description: "product-media",
  name: "products",
};
