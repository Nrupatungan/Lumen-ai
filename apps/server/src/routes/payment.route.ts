import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import {
  createOrder,
  verifyPayment,
  getMySubscription
} from "../controllers/payment.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.post("/order", createOrder);
router.post("/verify", verifyPayment);
router.post("/subscription", getMySubscription);

export default router;
