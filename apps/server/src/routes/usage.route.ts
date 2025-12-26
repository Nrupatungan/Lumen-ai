import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import { getUsageDashboard } from "../controllers/usage.controller.js";

const router: Router = Router();

router.get("/", authenticateJWT, getUsageDashboard);

export default router;
