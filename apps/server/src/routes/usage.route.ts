import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import {
  getUsageDashboard,
  getMyUsage,
} from "../controllers/usage.controller.js";

const router: Router = Router();

router.use(authenticateJWT);
router.get("/dashboard", getUsageDashboard);
router.get("/", getMyUsage);

export default router;
