import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập email")
  .email("Email không hợp lệ");
const password = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .max(128, "Mật khẩu tối đa 128 ký tự");

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email hoặc username"),
  password,
});

export const signUpSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(
        /^[a-zA-Z0-9_.]+$/,
        "Username chỉ gồm chữ, số, dấu gạch dưới và dấu chấm",
      ),
    name: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email,
    password,
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine(({ password: value, confirmPassword }) => value === confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine(({ password: value, confirmPassword }) => value === confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: password,
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine(
    ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
    {
      message: "Mật khẩu xác nhận không khớp",
      path: ["confirmPassword"],
    },
  );

export const oneTimePasswordSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Mã xác thực phải gồm 6 chữ số"),
});
