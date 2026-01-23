import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import {
  chatWithDocuments,
  getConversationMessages,
  listConversations,
  streamChat,
} from "../controllers/chat.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/conversations/:conversationId/messages", getConversationMessages);
router.post("/conversations", chatWithDocuments);
router.get("/conversations", listConversations);
router.post("/stream", streamChat);

export default router;
