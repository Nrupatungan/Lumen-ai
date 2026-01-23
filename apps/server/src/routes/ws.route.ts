import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import { issueWsToken } from "../controllers/ws.controller.js";

const router: Router = Router();

router.get("/issue-token", authenticateJWT, issueWsToken);

export default router;
