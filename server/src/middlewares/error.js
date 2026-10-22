import { ZodError } from "zod";
import { APIError } from "better-auth/api";
import { MulterError } from "multer";
export function notFoundHandler(req, res) {
  return res
    .status(404)
    .json({
      message: `Route ${req.method} ${req.originalUrl.split("?")[0]} not found`,
    });
}
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ZodError)
    return res
      .status(400)
      .json({ message: "Validation failed", issues: error.issues });
  if (error instanceof APIError)
    return res
      .status(error.statusCode ?? 403)
      .json({
        message: error.body?.message ?? error.message,
        code: error.body?.code,
      });
  if (error instanceof MulterError)
    return res
      .status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400)
      .json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Ảnh vượt quá giới hạn kích thước."
            : "Multipart không hợp lệ; chỉ nhận một file ảnh.",
      });
  if (error.type === "entity.too.large")
    return res
      .status(413)
      .json({ message: "Request vượt quá giới hạn kích thước." });
  if (error.type === "entity.parse.failed" || error instanceof SyntaxError)
    return res.status(400).json({ message: "JSON không hợp lệ." });
  const status = error.status ?? error.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 600)
    return res
      .status(status)
      .json({
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
        ...(error.issues ? { issues: error.issues } : {}),
      });
  console.error("[HTTP] Unhandled error", {
    name: error.name,
    code: error.code,
  });
  return res.status(500).json({ message: "Internal server error" });
}
