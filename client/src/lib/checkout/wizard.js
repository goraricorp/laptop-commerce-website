import { z } from "zod";

export const deliveryOptions = {
  standard: {
    label: "Tiêu chuẩn",
    detail: "Dự kiến 3–5 ngày làm việc",
    price: 0,
  },
  express: {
    label: "Giao nhanh",
    detail: "Dự kiến 1–2 ngày làm việc",
    price: 35000,
  },
};

export const pickupStores = {
  hcm: "Webkitlab Nguyễn Huệ, TP. Hồ Chí Minh",
  hn: "Webkitlab Láng Hạ, Hà Nội",
};

export const paymentLabels = {
  cod: "Thanh toán khi nhận hàng",
  momo: "MoMo",
  zalopay: "ZaloPay",
  vnpay: "VNPAY",
  paypal: "PayPal",
  stripe: "Stripe",
};

export const recipientSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên người nhận").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]+$/, "Số điện thoại không hợp lệ")
    .refine((value) => {
      const length = value.replace(/\D/g, "").length;
      return length >= 9 && length <= 15;
    }, "Số điện thoại cần có 9–15 chữ số"),
  email: z.email("Email không hợp lệ"),
  delivery: z.enum(["delivery", "store"]),
  addressId: z.string().optional(),
  store: z.enum(["hcm", "hn"]),
  shipping: z.enum(["standard", "express"]),
  note: z.string().max(1000, "Ghi chú tối đa 1.000 ký tự"),
});
export const paymentSchema = z.enum([
  "cod",
  "momo",
  "zalopay",
  "vnpay",
  "paypal",
  "stripe",
]);

export function cartIsValid(items) {
  return (
    items.length > 0 &&
    items.every(
      (item) =>
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.price) &&
        item.price >= 0,
    )
  );
}

export function validateWizardStep(
  step,
  items,
  recipient,
  payment,
  addresses = [],
) {
  if (!cartIsValid(items))
    return { cart: "Vui lòng chọn sản phẩm hợp lệ trong giỏ hàng." };
  if (step === 0) return {};
  if (
    recipient.delivery === "delivery" &&
    !addresses.some((address) => address.id === recipient.addressId)
  )
    return { addressId: "Vui lòng chọn địa chỉ trong sổ địa chỉ." };
  const result = recipientSchema.safeParse(recipient);
  if (!result.success)
    return Object.fromEntries(
      result.error.issues.map((issue) => [issue.path[0], issue.message]),
    );
  if (step >= 2 && !paymentSchema.safeParse(payment).success)
    return { payment: "Vui lòng chọn phương thức thanh toán." };
  return {};
}
