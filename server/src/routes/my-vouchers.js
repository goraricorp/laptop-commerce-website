import { readQueries } from "../database/read-queries.js";
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../database/index.js";
import {
  promotions,
  promotionCodes,
  promotionUsages,
} from "../database/schema.js";
import { requireAuth } from "../middlewares/auth.js";
const router = Router();
router.get("/me/vouchers", requireAuth, async (req, res) => {
  const [codes, usages] = await db.transaction(
    (tx) =>
      readQueries([
        tx
          .select({
            code: promotionCodes,
            promotion: promotions,
          })
          .from(promotionCodes)
          .innerJoin(promotions, eq(promotions.id, promotionCodes.promotionId)),
        tx
          .select()
          .from(promotionUsages)
          .where(eq(promotionUsages.userId, req["user"].id)),
      ]),
    {
      isolationLevel: "repeatable read",
      accessMode: "read only",
    },
  );
  const now = Date.now();
  return (
    res.set("Cache-Control", "no-store"),
    res.status(200).json(
      codes.map(({ code, promotion }) => {
        const used = usages.filter(
          (usage) => usage.promotionCodeId === code.id,
        ).length;
        const state =
          used >= code.usagePerUser
            ? "used"
            : !promotion.isActive || +new Date(promotion.endsAt) <= now
              ? "expired"
              : +new Date(promotion.startsAt) > now
                ? "upcoming"
                : code.usageLimit !== null && code.usedCount >= code.usageLimit
                  ? "exhausted"
                  : "available";
        return {
          ...promotion,
          ...code,
          name: promotion.name,
          state,
          remainingForUser: Math.max(0, code.usagePerUser - used),
        };
      }),
    )
  );
});
export default router;
