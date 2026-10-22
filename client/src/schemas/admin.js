import { z } from "zod";

import { dateTimeSchema, resourceSchemas, uuidSchema } from "@/schemas/common";

export const userRoleSchema = z.enum([
  "user",
  "moderator",
  "administrator",
  "master",
]);

export const adminUserSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: userRoleSchema,
  username: z.string().nullable().optional(),
  displayUsername: z.string().nullable().optional(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  birthday: z.string().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const adminUserInputSchema = z.object({
  name: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.email("Email không hợp lệ"),
  emailVerified: z.boolean().optional(),
  image: z.url("Ảnh đại diện phải là URL hợp lệ").nullable().optional(),
  role: userRoleSchema.optional(),
  username: z.string().min(3).max(30).optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().max(15).nullable().optional(),
  birthday: z.string().nullable().optional(),
});

export const adminSchemas = {
  user: resourceSchemas(adminUserSchema, adminUserInputSchema),
};
