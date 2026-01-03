import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import {
  chatWithDocuments,
  streamChat,
} from "../controllers/chat.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.post("/", chatWithDocuments);
router.post("/stream", streamChat);

export default router;
