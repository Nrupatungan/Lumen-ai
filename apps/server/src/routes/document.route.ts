import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import {
  deleteDocument,
  getDocumentStatus,
  listDocuments,
  uploadDocument,
} from "../controllers/document.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.post("/", uploadDocument);
router.get("/", listDocuments);
router.get("/:id/status", getDocumentStatus);
router.delete("/:id", deleteDocument);

export default router;
