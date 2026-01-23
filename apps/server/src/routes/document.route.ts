import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import {
  deleteDocument,
  getDocumentChunk,
  getDocumentStatus,
  listDocuments,
  uploadDocument,
} from "../controllers/document.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.post("/upload", uploadDocument);
router.get("/chunks/:chunkId", getDocumentChunk);
router.get("/", listDocuments);
router.get("/:documentId/status", getDocumentStatus);
router.delete("/:documentId", deleteDocument);

export default router;
