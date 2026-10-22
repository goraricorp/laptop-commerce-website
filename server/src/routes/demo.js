import { Router } from "express";
import {
  getAvailability,
  getCount,
  getHello,
  getOverview,
} from "../controllers/demo.js";
const router = Router();
router.get("/hello", getHello);
router.get("/count", getCount);
router.get("/available", getAvailability);
router.get("/overview", getOverview);
export default router;
