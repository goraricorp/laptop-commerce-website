import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/index.js";
import {
  accountAudits,
  session,
  uploadAssets,
  user,
} from "../database/schema.js";
import { assertAssured } from "../lib/auth/assurance.js";
import { activeOwner, domainError as error } from "./account-state.js";
import { attachAssets, queueAssetCleanup } from "./storage.js";
const birthday = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })])
  .transform((v) => new Date(v))
  .nullable()
  .optional();
const profile = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    image: z.url().max(4096).nullable().optional(),
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_.]{3,30}$/)
      .optional(),
    firstName: z.string().max(255).nullable().optional(),
    lastName: z.string().max(255).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    birthday,
  })
  .strict();
const adminProfile = profile
  .extend({
    email: z.email().max(254).optional(),
    emailVerified: z.boolean().optional(),
    role: z.enum(["user", "moderator", "administrator", "master"]).optional(),
  })
  .strict();
export async function saveAccountProfile(
  current,
  raw,
  { targetId = current.user.id, admin = false } = {},
) {
  assertAssured(current, { fresh: admin });
  const input = (admin ? adminProfile : profile).parse(raw);
  if (!Object.keys(input).length)
    throw error("Không có thông tin cần cập nhật.", 400);
  let oldImage;
  const result = await db
    .transaction(async (tx) => {
      // Same order as anonymization and master handoff.
      if (admin)
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('master-handoff',0))`,
        );
      const actor = await activeOwner(tx, current.user.id);
      if (admin && actor.role !== "master")
        throw error("Chỉ master được sửa người dùng.", 403);
      const target =
        targetId === actor.id ? actor : await activeOwner(tx, targetId);
      if (target.role === "master" && input.role && input.role !== "master")
        throw error(
          "Bàn giao master qua nghiệp vụ tài khoản trước khi đổi quyền.",
        );
      oldImage = target.image;
      if (input.image) {
        const [asset] = await tx
          .select()
          .from(uploadAssets)
          .where(eq(uploadAssets.url, input.image))
          .for("update");
        if (
          asset?.purpose === "support" ||
          (asset?.state === "pending" && asset.userId !== actor.id)
        )
          throw error(
            "Ảnh riêng tư hoặc chưa lưu của người khác không được dùng làm ảnh đại diện.",
            403,
          );
        await attachAssets(tx, [input.image]);
      }
      const data = { ...input, updatedAt: new Date() };
      if (input.username) {
        data.username = input.username.toLowerCase();
        data.displayUsername = input.username;
      }
      if (input.email) data.email = input.email.toLowerCase();
      const [updated] = await tx
        .update(user)
        .set(data)
        .where(eq(user.id, target.id))
        .returning();
      if (input.role && input.role !== target.role)
        await tx
          .delete(session)
          .where(
            and(
              eq(session.userId, target.id),
              sql`${session.id}<>${current.session.id}::uuid`,
            ),
          );
      if (admin)
        await tx
          .insert(accountAudits)
          .values({
            actorId: actor.id,
            subjectId: target.id,
            action: "account.profile_updated",
            details: { fields: Object.keys(input) },
          });
      const {
        id,
        name,
        email,
        emailVerified,
        image,
        role,
        username,
        displayUsername,
        firstName,
        lastName,
        phone,
        birthday,
        createdAt,
        updatedAt,
        twoFactorEnabled,
      } = updated;
      return {
        id,
        name,
        email,
        emailVerified,
        image,
        role,
        username,
        displayUsername,
        firstName,
        lastName,
        phone,
        birthday,
        createdAt,
        updatedAt,
        twoFactorEnabled,
      };
    })
    .catch((cause) => {
      if ((cause.cause?.code ?? cause.code) === "23505")
        throw error("Email hoặc username đã được sử dụng.");
      throw cause;
    });
  if (oldImage && oldImage !== result.image)
    await queueAssetCleanup([oldImage]).catch(() => {});
  return result;
}
