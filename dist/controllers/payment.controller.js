"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const zod_1 = require("zod");
const payment_service_1 = require("../services/payment.service");
const response_1 = require("../utils/response");
const payment_validator_1 = require("../validators/payment.validator");
class PaymentController {
    static async createOrder(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendError)(res, "Unauthorized", 401);
            }
            const { courseId } = payment_validator_1.createOrderSchema.parse(req.body);
            const result = await payment_service_1.PaymentService.createOrder(courseId, req.user.userId);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to create PayPal order";
            const statusCode = message === "Unauthorized"
                ? 401
                : message === "Course not found" || message === "PayPal order not found"
                    ? 404
                    : message === "Course already purchased" || message === "This course does not require PayPal payment"
                        ? 409
                        : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
    static async captureOrder(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendError)(res, "Unauthorized", 401);
            }
            const { orderId } = payment_validator_1.captureOrderSchema.parse(req.body);
            const enrollment = await payment_service_1.PaymentService.captureOrder(orderId, req.user.userId);
            return (0, response_1.sendSuccess)(res, enrollment);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to capture PayPal order";
            const statusCode = message === "PayPal order not found"
                ? 404
                : message === "This PayPal order has already been captured"
                    ? 409
                    : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
}
exports.PaymentController = PaymentController;
