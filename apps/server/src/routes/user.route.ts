import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import {
  deleteMe,
  getMe,
  login,
  oauthLogin,
  register,
  requestPasswordReset,
  resetPassword,
  updateMe,
  verifyEmail,
} from "../controllers/user.controller.js";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/oauth-login", oauthLogin);

router.post("/verify-email", verifyEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.use(authenticateJWT);

router.get("/me", getMe);
router.patch("/me", updateMe);
router.delete("/me", deleteMe);

export default router;
