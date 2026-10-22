import { Router } from "express";
import { checkCaptcha } from "../controllers/captcha.js";
const router = Router();
router.post("/verify", checkCaptcha);
export default router;
