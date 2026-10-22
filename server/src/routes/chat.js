import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireModerator } from "../middlewares/moderator.js";
const router = Router();
for (const prefix of ["/conversation", "/message"])
  router.use(prefix, requireAuth, requireModerator, (req, res) =>
    res.status(410).json({
      message: "Dùng phiếu hỗ trợ có phân công qua /staff/support.",
    }),
  );
export default router;
