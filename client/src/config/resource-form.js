import { z } from "zod";

const labels = {
  accountId: "Mã tài khoản nhà cung cấp",
  actorType: "Loại người tham gia",
  address: "Địa chỉ",
  addressLine: "Địa chỉ chi tiết",
  alt: "Văn bản thay thế",
  amount: "Số tiền",
  attributeId: "Thuộc tính",
  attributeValueId: "Giá trị thuộc tính",
  barcode: "Mã vạch",
  birthday: "Ngày sinh",
  brandId: "Thương hiệu",
  carrier: "Đơn vị vận chuyển",
  cartId: "Giỏ hàng",
  categoryId: "Danh mục",
  code: "Mã",
  comment: "Nội dung đánh giá",
  compareAtPrice: "Giá niêm yết",
  content: "Nội dung",
  format: "Định dạng nội dung",
  costPrice: "Giá vốn",
  country: "Quốc gia",
  description: "Mô tả",
  discountTotal: "Tổng giảm giá",
  discountType: "Loại giảm giá",
  discountValue: "Giá trị giảm",
  displayName: "Tên hiển thị",
  displayType: "Kiểu hiển thị",
  district: "Quận/Huyện",
  email: "Email",
  emailVerified: "Đã xác thực email",
  endsAt: "Thời gian kết thúc",
  expiresAt: "Thời gian hết hạn",
  firstName: "Tên",
  fulfillmentStatus: "Trạng thái hoàn tất",
  guestEmail: "Email khách",
  guestName: "Tên khách",
  guestToken: "Mã giỏ hàng khách",
  image: "Ảnh đại diện",
  imageUrl: "Đường dẫn hình ảnh",
  ipAddress: "Địa chỉ IP",
  isActive: "Đang hoạt động",
  isDefault: "Địa chỉ mặc định",
  isFilterable: "Cho phép lọc",
  isPrimary: "Ảnh đại diện",
  isVerifiedPurchase: "Đã xác minh mua hàng",
  issuer: "Đơn vị phát hành",
  lastName: "Họ",
  logoUrl: "Logo",
  maximumDiscount: "Giảm tối đa",
  mediaType: "Loại nội dung",
  metadata: "Dữ liệu bổ sung",
  method: "Phương thức",
  mimeType: "Loại tệp",
  minimumOrderValue: "Đơn tối thiểu",
  name: "Tên",
  note: "Ghi chú",
  orderId: "Đơn hàng",
  orderItemId: "Dòng đơn hàng",
  orderStatus: "Trạng thái đơn",
  paidAt: "Thời gian thanh toán",
  parentId: "Danh mục cha",
  password: "Mật khẩu",
  paymentStatus: "Trạng thái thanh toán",
  phone: "Số điện thoại",
  position: "Thứ tự",
  price: "Giá bán",
  productId: "Sản phẩm",
  productName: "Tên sản phẩm",
  productType: "Loại sản phẩm",
  promotionCodeId: "Mã khuyến mãi",
  promotionId: "Khuyến mãi",
  provider: "Nhà cung cấp",
  providerId: "Nhà cung cấp đăng nhập",
  province: "Tỉnh/Thành phố",
  quantity: "Số lượng",
  quantityOnHand: "Tồn thực tế",
  quantityReserved: "Đang giữ",
  recipientName: "Người nhận",
  referenceId: "Mã tham chiếu",
  referenceType: "Loại tham chiếu",
  reorderLevel: "Ngưỡng nhập lại",
  role: "Vai trò",
  score: "Số sao",
  senderType: "Loại người gửi",
  shippedAt: "Thời gian gửi",
  shippingTotal: "Phí vận chuyển",
  sizeBytes: "Dung lượng tệp",
  sku: "SKU",
  slug: "Đường dẫn",
  startsAt: "Thời gian bắt đầu",
  status: "Trạng thái",
  subject: "Chủ đề",
  subtotal: "Tạm tính",
  title: "Tiêu đề",
  token: "Mã phiên",
  total: "Thành tiền",
  trackingNumber: "Mã vận đơn",
  transactionId: "Mã giao dịch",
  type: "Loại",
  unitPrice: "Đơn giá",
  updatedAt: "Cập nhật lúc",
  url: "Đường dẫn",
  usageLimit: "Giới hạn sử dụng",
  usagePerUser: "Giới hạn mỗi người",
  usedAt: "Thời gian sử dụng",
  usedCount: "Đã sử dụng",
  userAgent: "Thiết bị",
  userId: "Người dùng",
  value: "Giá trị",
  variantId: "Biến thể",
  variantName: "Tên biến thể",
  ward: "Phường/Xã",
  weightGrams: "Khối lượng (gram)",
};

const optionLabels = {
  active: "Đang hoạt động",
  adjustment: "Điều chỉnh",
  administrator: "Quản trị viên",
  archived: "Đã lưu trữ",
  abandoned: "Đã bỏ quên",
  accessory: "Phụ kiện",
  bank_transfer: "Chuyển khoản",
  billing: "Thanh toán",
  boolean: "Đúng/Sai",
  buyer_chatbot: "Người mua và chatbot",
  "buyer-chatbot": "Người mua và chatbot",
  "buyer-seller": "Người mua và người bán",
  cancelled: "Đã hủy",
  card: "Thẻ",
  chatbot: "Chatbot",
  closed: "Đã đóng",
  cod: "Thanh toán khi nhận hàng",
  color: "Màu sắc",
  completed: "Hoàn thành",
  component: "Linh kiện",
  confirmed: "Đã xác nhận",
  converted: "Đã đặt hàng",
  delivered: "Đã giao",
  discontinued: "Ngừng kinh doanh",
  draft: "Bản nháp",
  failed: "Thất bại",
  fixed: "Số tiền cố định",
  guest: "Khách",
  hidden: "Đã ẩn",
  home: "Nhà riêng",
  image: "Hình ảnh",
  inactive: "Ngừng hoạt động",
  in_transit: "Đang vận chuyển",
  issue: "Xuất kho",
  laptop: "Laptop",
  master: "Chủ hệ thống",
  moderator: "Điều hành viên",
  momo: "MoMo",
  monitor: "Màn hình",
  number: "Số",
  office: "Văn phòng",
  online: "Trực tuyến",
  open: "Đang mở",
  other: "Khác",
  out_of_stock: "Hết hàng",
  paid: "Đã thanh toán",
  partially_refunded: "Hoàn tiền một phần",
  paypal: "PayPal",
  pending: "Đang chờ",
  percentage: "Phần trăm",
  processing: "Đang xử lý",
  published: "Đã xuất bản",
  receipt: "Nhập kho",
  refunded: "Đã hoàn tiền",
  rejected: "Từ chối",
  release: "Giải phóng",
  reservation: "Giữ hàng",
  resolved: "Đã giải quyết",
  return: "Nhập hàng trả lại",
  returned: "Đã trả lại",
  select: "Danh sách chọn",
  service_center: "Trung tâm bảo hành",
  shipped: "Đã gửi",
  shipping: "Giao hàng",
  store: "Cửa hàng",
  support: "Hỗ trợ",
  system: "Hệ thống",
  text: "Văn bản",
  transfer_in: "Nhận chuyển kho",
  transfer_out: "Chuyển kho đi",
  unpaid: "Chưa thanh toán",
  unfulfilled: "Chưa xử lý",
  user: "Người dùng",
  video: "Video",
  vnpay: "VNPay",
  wallet: "Ví điện tử",
  warehouse: "Kho hàng",
};

const textareas = new Set([
  "address",
  "addressLine",
  "comment",
  "content",
  "description",
  "note",
  "summary",
  "userAgent",
]);
const jsonFields = new Set(["metadata"]);
const dateFields = new Set(["birthday"]);
const dateTimeFields = new Set([
  "accessTokenExpiresAt",
  "deliveredAt",
  "endsAt",
  "expiresAt",
  "joinedAt",
  "paidAt",
  "refreshTokenExpiresAt",
  "shippedAt",
  "startsAt",
  "usedAt",
]);
const numberFields = new Set([
  "position",
  "quantity",
  "quantityOnHand",
  "quantityReserved",
  "reorderLevel",
  "score",
  "sizeBytes",
  "usageLimit",
  "usagePerUser",
  "usedCount",
  "weightGrams",
]);
const urlFields = new Set(["image", "imageUrl", "logoUrl", "url"]);

function inspect(schema) {
  let current = schema;
  let optional = false;
  let nullable = false;

  while (
    current instanceof z.ZodOptional ||
    current instanceof z.ZodNullable ||
    current instanceof z.ZodDefault
  ) {
    optional ||=
      current instanceof z.ZodOptional || current instanceof z.ZodDefault;
    nullable ||= current instanceof z.ZodNullable;
    current = current.unwrap();
  }

  return { schema: current, optional, nullable };
}

function humanize(value) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function buildResourceFields(resourceSchema) {
  return Object.entries(resourceSchema.create.shape).map(
    ([name, fieldSchema]) => {
      const details = inspect(fieldSchema);
      const config = {
        name,
        label: labels[name] || humanize(name),
        optional: details.optional,
        nullable: details.nullable,
      };

      const relations = {
        parentId: "categories",
        categoryId: "categories",
        brandId: "brands",
        productId: "products",
        variantId: "product-variants",
        attributeId: "attributes",
        attributeValueId: "attribute-values",
        locationId: "inventory-locations",
        promotionId: "promotions",
        promotionCodeId: "promotion-codes",
        userId: "users",
        orderId: "orders",
        orderItemId: "order-items",
        cartId: "carts",
        conversationId: "conversations",
        messageId: "messages",
      };
      if (relations[name])
        return { ...config, type: "relation", resource: relations[name] };
      if (name === "productType") return { ...config, type: "readonly" };
      if (details.schema instanceof z.ZodBoolean)
        return { ...config, type: "checkbox" };
      if (details.schema instanceof z.ZodEnum) {
        return {
          ...config,
          type: "select",
          options: details.schema.options.map((value) => ({
            value,
            label: optionLabels[value] || humanize(value),
          })),
        };
      }
      if (details.schema instanceof z.ZodNumber || numberFields.has(name))
        return { ...config, type: "number", step: 1 };
      if (jsonFields.has(name) || details.schema instanceof z.ZodRecord)
        return { ...config, type: "json", rows: 5, className: "sm:col-span-2" };
      if (dateTimeFields.has(name))
        return { ...config, type: "datetime-local" };
      if (dateFields.has(name)) return { ...config, type: "date" };
      if (urlFields.has(name)) return { ...config, type: "image-upload" };
      if (name === "password") return { ...config, type: "password" };
      if (textareas.has(name))
        return {
          ...config,
          type: "textarea",
          rows: 4,
          className: "sm:col-span-2",
        };
      return { ...config, type: "text" };
    },
  );
}

export function resourceDefaultValues(fields, entity) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = entity?.[field.name];
      if (value !== undefined) return [field.name, value];
      if (field.type === "checkbox") return [field.name, false];
      if (field.nullable) return [field.name, null];
      return [field.name, field.optional ? undefined : ""];
    }),
  );
}
