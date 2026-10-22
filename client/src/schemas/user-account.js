import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(255, "Không được vượt quá 255 ký tự");

export const userAccountSchema = z
  .object({
    username: z
      .string()
      .trim()
      .regex(
        /^$|^[a-zA-Z0-9_.]{3,30}$/,
        "Username từ 3 đến 30 ký tự, chỉ gồm chữ, số, dấu chấm và gạch dưới",
      )
      .optional(),
    birthday: z.string(),
    currentPassword: z.string(),
    email: z.email("Email không hợp lệ"),
    firstName: optionalText,
    image: z.string().trim().max(2048, "Đường dẫn ảnh quá dài"),
    lastName: optionalText,
    name: z.string().trim().min(1, "Vui lòng nhập tên hiển thị").max(255),
    newPassword: z.string(),
    phone: z.string().trim().max(30, "Số điện thoại không hợp lệ"),
  })
  .superRefine((value, context) => {
    if (!value.currentPassword && !value.newPassword) return;
    if (!value.currentPassword) {
      context.addIssue({
        code: "custom",
        message: "Vui lòng nhập mật khẩu hiện tại",
        path: ["currentPassword"],
      });
    }
    if (value.newPassword.length < 8) {
      context.addIssue({
        code: "custom",
        message: "Mật khẩu mới phải có ít nhất 8 ký tự",
        path: ["newPassword"],
      });
    }
  });
