import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import {
  createOrder,
  verifyPayment,
  getMySubscription,
  getMyPayments,
} from "../controllers/payment.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/", getMyPayments);
router.get("/subscription", getMySubscription);
router.post("/order", createOrder);
router.post("/verify", verifyPayment);

export default router;
