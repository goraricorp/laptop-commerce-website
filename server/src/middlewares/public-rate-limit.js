import { createHash } from "node:crypto";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { PostgresRateLimitStore } from "./rate-limit.js";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const handler = (req, res) =>
  res.status(429).json({ message: "Quá nhiều yêu cầu. Vui lòng thử lại sau." });
export function publicRateLimit(scope, limit = 10) {
  const common = {
    windowMs: 60000,
    limit,
    standardHeaders: "draft-6",
    legacyHeaders: false,
    passOnStoreError: false,
    handler,
  };
  const ip = rateLimit({
    ...common,
    store: new PostgresRateLimitStore(),
    keyGenerator: (req) => `public:${scope}:ip:${hash(ipKeyGenerator(req.ip))}`,
  });
  const email =
    scope === "newsletter"
      ? rateLimit({
          ...common,
          store: new PostgresRateLimitStore(),
          keyGenerator: (req) =>
            `public:${scope}:email:${hash(req.body.email.trim().toLowerCase())}`,
        })
      : null;
  return (req, res, next) =>
    ip(req, res, (error) => {
      if (error) return next(error);
      return email && typeof req.body?.email === "string"
        ? email(req, res, next)
        : next();
    });
}
