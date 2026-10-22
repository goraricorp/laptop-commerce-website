import { createHash, randomUUID } from "node:crypto";
import { rateLimit as expressRateLimit } from "express-rate-limit";
import { sql } from "drizzle-orm";
import { db } from "../database/index.js";
export async function consumeRateLimit(key, windowMs, now = Date.now()) {
  const result = await db.execute(
    sql`insert into rate_limit(id,key,count,last_request) values(${randomUUID()},${key},1,${now}) on conflict(key) do update set count=case when rate_limit.last_request<=${now - windowMs} then 1 else rate_limit.count+1 end,last_request=case when rate_limit.last_request<=${now - windowMs} then ${now} else rate_limit.last_request end returning count,last_request`,
  );
  return result.rows[0];
}
export class PostgresRateLimitStore {
  constructor({ consume = consumeRateLimit } = {}) {
    this.consume = consume;
    this.localKeys = false;
  }
  init(options) {
    this.windowMs = options.windowMs;
  }
  async increment(key) {
    const row = await this.consume(key, this.windowMs);
    return {
      totalHits: Number(row.count),
      resetTime: new Date(Number(row.last_request) + this.windowMs),
    };
  }
  async decrement() {
    /* Requests count even if downstream fails; skipFailedRequests is disabled. */
  }
  async resetKey(key) {
    await db.execute(sql`delete from rate_limit where key=${key}`);
  }
}
export function rateLimit({
  scope,
  windowMs,
  limit,
  consume = consumeRateLimit,
}) {
  if (
    !scope ||
    !Number.isSafeInteger(windowMs) ||
    windowMs <= 0 ||
    !Number.isSafeInteger(limit) ||
    limit <= 0
  )
    throw new Error("Invalid rate limit configuration");
  const middleware = expressRateLimit({
    windowMs,
    limit,
    store: new PostgresRateLimitStore({ consume }),
    keyGenerator: (req) =>
      `http:${scope}:${createHash("sha256").update(req.user.id).digest("hex")}`,
    standardHeaders: "draft-6",
    legacyHeaders: false,
    passOnStoreError: false,
    handler: (req, res) =>
      res
        .status(429)
        .json({ message: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }),
  });
  return (req, res, next) =>
    req.user?.id
      ? middleware(req, res, next)
      : res.status(401).json({ message: "Unauthorized" });
}
