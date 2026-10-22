import { activeOwner } from "../services/account-state.js";
import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database/index.js";
import { addresses } from "../database/schema.js";
import { requireAuth } from "../middlewares/auth.js";
import { clientUrl } from "../lib/utils/environment.js";
export const addressInput = z
  .object({
    recipientName: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]+$/)
      .refine((value) => {
        const length = value.replace(/\D/g, "").length;
        return length >= 9 && length <= 15;
      }),
    type: z.enum(["home", "office", "other"]).default("home"),
    addressLine: z.string().trim().min(5).max(500),
    ward: z.string().trim().max(100).nullable().optional(),
    district: z.string().trim().min(1).max(100),
    province: z.string().trim().min(1).max(100),
    country: z.string().trim().min(1).max(100).default("Việt Nam"),
    isDefault: z.boolean().default(false),
  })
  .strict();
export const addressPatch = addressInput
  .partial()
  .extend({
    type: addressInput.shape.type.removeDefault().optional(),
    country: addressInput.shape.country.removeDefault().optional(),
    isDefault: addressInput.shape.isDefault.removeDefault().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
const router = Router();
router.use("/me/addresses", requireAuth, (req, res, next) => {
  if (
    req.method !== "GET" &&
    req.get("origin") &&
    req.get("origin") !== clientUrl
  )
    return res.status(403).json({
      message: "Origin không được phép.",
    });
  return next();
});
const owned = (id, userId) =>
  and(eq(addresses.id, id), eq(addresses.userId, userId));
router.get("/me/addresses", async (req, res) => {
  res.set("Cache-Control", "no-store");
  return res
    .status(200)
    .json(
      await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, req["user"].id))
        .orderBy(desc(addresses.isDefault), desc(addresses.createdAt)),
    );
});
router.post("/me/addresses", async (req, res) => {
  const data = addressInput.parse(req["body"]);
  const result = await db.transaction(async (tx) => {
    await activeOwner(tx, req["user"].id);
    if (data.isDefault)
      await tx
        .update(addresses)
        .set({
          isDefault: false,
        })
        .where(eq(addresses.userId, req["user"].id));
    return (
      await tx
        .insert(addresses)
        .values({
          ...data,
          userId: req["user"].id,
        })
        .returning()
    )[0];
  });
  return res.status(201).json(result);
});
router.patch("/me/addresses/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const data = addressPatch.parse(req["body"]);
  const result = await db.transaction(async (tx) => {
    await activeOwner(tx, req["user"].id);
    const target = (
      await tx.select().from(addresses).where(owned(id, req["user"].id))
    )[0];
    if (!target) return null;
    if (data.isDefault)
      await tx
        .update(addresses)
        .set({
          isDefault: false,
        })
        .where(eq(addresses.userId, req["user"].id));
    return (
      await tx
        .update(addresses)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(owned(id, req["user"].id))
        .returning()
    )[0];
  });
  if (!result)
    return res.status(404).json({
      message: "Không tìm thấy địa chỉ.",
    });
  return res.status(200).json(result);
});
router.delete("/me/addresses/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const result = (
    await db.delete(addresses).where(owned(id, req["user"].id)).returning({
      id: addresses.id,
    })
  )[0];
  if (!result)
    return res.status(404).json({
      message: "Không tìm thấy địa chỉ.",
    });
  return res.status(200).json(result);
});
export default router;
