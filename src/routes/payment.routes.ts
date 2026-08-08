import { Router } from "express";

import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/create-order", authMiddleware, PaymentController.createOrder);
router.post("/capture-order", authMiddleware, PaymentController.captureOrder);

export default router;