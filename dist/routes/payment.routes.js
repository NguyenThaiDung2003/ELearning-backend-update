"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/create-order", auth_middleware_1.authMiddleware, payment_controller_1.PaymentController.createOrder);
router.post("/capture-order", auth_middleware_1.authMiddleware, payment_controller_1.PaymentController.captureOrder);
exports.default = router;
