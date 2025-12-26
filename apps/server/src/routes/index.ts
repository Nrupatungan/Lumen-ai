import { Router } from "express";
import userRoutes from "./user.route.js";
import paymentRoutes from "./payment.route.js";
import chatRoutes from "./chat.route.js";
import documentRoutes from "./document.route.js";
import usageRoutes from "./usage.route.js";

const router: Router = Router();

router.use("/users", userRoutes);
router.use("/payments", paymentRoutes);
router.use("/chat", chatRoutes);
router.use("/documents", documentRoutes);
router.use("/usage", usageRoutes);

export default router;
