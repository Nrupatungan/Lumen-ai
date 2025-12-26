import { Router } from "express";
import { authenticateJWT } from "../middlewares/jwt-verify.middleware.js";
import {
  createOrder,
  getSubscription,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.post("/order", createOrder);
router.post("/verify", verifyPayment);
router.get("/subscription", getSubscription);

export default router;
