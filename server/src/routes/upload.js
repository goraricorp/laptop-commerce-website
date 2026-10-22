import multer from "multer";
import { fromNodeHeaders } from "better-auth/node";
import { activeOwner } from "../services/account-state.js";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth/index.js";
import { assertAssured } from "../lib/auth/assurance.js";
import {
  conversations,
  messages,
  messageAttachments,
} from "../database/schema.js";
import { Router } from "express";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { imageExtension } from "../lib/upload/image-file.js";
import { requireAuth } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rate-limit.js";
import {
  deleteObject,
  getObjectUrl,
  uploadObject,
} from "../lib/upload/s3-client.js";
import { clientUrl, serverUrl } from "../lib/utils/environment.js";
import { db } from "../database/index.js";
import { uploadAssets } from "../database/schema.js";
import { deleteAsset } from "../services/storage.js";
const bucket = process.env.VITE_STORAGE_BUCKET || "public";
const configuredMax = Number(process.env.VITE_STORAGE_MAX_FILE_SIZE || 4000000);
if (!Number.isSafeInteger(configuredMax) || configuredMax <= 0)
  throw new Error("VITE_STORAGE_MAX_FILE_SIZE must be a positive integer");
export const maxUploadSize = Math.min(4000000, configuredMax);
const allowedTypes = (
  process.env.VITE_STORAGE_ALLOWED_TYPES || "image/jpeg,image/png,image/webp"
)
  .split(",")
  .map((type) => type.trim());
const multipart = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Busboy signals its size limit at equality. Check the inclusive business
    // limit ourselves while keeping the in-memory parser bounded to one extra byte.
    fileSize: maxUploadSize + 1,
    files: 1,
    fields: 0,
    parts: 1,
    fieldNameSize: 100,
    headerPairs: 20,
  },
  fileFilter: (req, file, done) => {
    if (!allowedTypes.includes(file.mimetype))
      return done(
        Object.assign(new Error("Định dạng file không được phép."), {
          status: 400,
        }),
      );
    done(null, true);
  },
}).single("file");
const router = Router();
const originCheck = async (req, res, next) => {
  if (
    (req.get("origin") && req.get("origin") !== clientUrl) ||
    req.get("sec-fetch-site") === "cross-site"
  )
    return res.status(403).json({
      message: "Origin không được phép.",
    });
  await next();
};
router.post(
  "/storage/upload",
  requireAuth,
  originCheck,
  rateLimit({
    scope: "upload",
    windowMs: 60000,
    limit: 20,
  }),
  (req, res, next) => {
    multipart(req, res, (error) => {
      if (error && !(error instanceof multer.MulterError))
        return next(
          Object.assign(new Error("Multipart không hợp lệ."), { status: 400 }),
        );
      next(error);
    });
  },
  async (req, res) => {
    const purpose = req.query["purpose"] ?? "general";
    if (!["general", "support"].includes(purpose))
      return res.status(400).json({
        message: "Mục đích ảnh không hợp lệ.",
      });
    if (!req.file?.size)
      return res
        .status(400)
        .json({ message: "Vui lòng chọn một file ảnh không rỗng." });
    if (req.file.size > maxUploadSize)
      return res
        .status(413)
        .json({ message: "Ảnh vượt quá giới hạn kích thước." });
    const file = { ...req.file, private: purpose === "support" };
    const ext = imageExtension(file);
    const name = `${randomUUID()}.${ext}`;
    const key = `public/users/${req["user"].id}/${name}`;
    await uploadObject(bucket, key, file);
    const url = `${serverUrl.replace(/\/$/, "")}/storage/object?key=${encodeURIComponent(key)}`;
    try {
      await db.transaction(async (tx) => {
        await activeOwner(tx, req["user"].id);
        await tx.insert(uploadAssets).values({
          key,
          url,
          userId: req["user"].id,
          purpose,
        });
      });
    } catch (error) {
      await deleteObject(bucket, key);
      throw error;
    }
    return res.status(201).json({
      name,
      originalName: file.originalname,
      path: key,
      url,
    });
  },
);
router.get("/storage/object", async (req, res) => {
  const key = req.query["key"];
  if (
    !key ||
    !/^public\/users\/[a-zA-Z0-9_-]+\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif|avif|pdf)$/.test(
      key,
    )
  )
    return res.status(400).json({
      message: "Đường dẫn file không hợp lệ.",
    });
  res.set("Cache-Control", "no-store");
  const [asset] = await db
    .select()
    .from(uploadAssets)
    .where(eq(uploadAssets.key, key));
  if (asset?.purpose === "support") {
    const current = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!current)
      return res.status(401).json({
        message: "Unauthorized",
      });
    try {
      assertAssured(current);
    } catch {
      return res.status(403).json({
        message: "Cần xác minh hai bước.",
      });
    }
    const links = await db
      .select({
        ownerId: conversations.ownerId,
        assignedToId: conversations.assignedToId,
      })
      .from(messageAttachments)
      .innerJoin(messages, eq(messages.id, messageAttachments.messageId))
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(eq(messageAttachments.url, asset.url));
    const permitted =
      asset.state === "pending"
        ? asset.userId === current.user.id
        : links.some(
            (row) =>
              row.ownerId === current.user.id ||
              (row.assignedToId === current.user.id &&
                ["moderator", "administrator", "master"].includes(
                  current.user.role,
                )),
          );
    if (!permitted)
      return res.status(403).json({
        message: "Không có quyền xem ảnh này.",
      });
  }
  return res.redirect(
    302,
    await getObjectUrl(bucket, key, {
      private: asset?.purpose === "support",
    }),
  );
});
router.delete("/storage/object", requireAuth, originCheck, async (req, res) => {
  const key = req["body"]?.key;
  if (
    typeof key !== "string" ||
    !/^public\/users\/[a-zA-Z0-9_-]+\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/.test(
      key,
    )
  )
    return res.status(400).json({
      message: "Đường dẫn ảnh không hợp lệ.",
    });
  return res.status(200).json(await deleteAsset(key, req["user"]));
});
export default router;
