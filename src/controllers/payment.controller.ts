import { Response } from "express";
import { ZodError } from "zod";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { PaymentService } from "../services/payment.service";
import { sendError, sendSuccess } from "../utils/response";
import { captureOrderSchema, createOrderSchema } from "../validators/payment.validator";

export class PaymentController {
  static async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }

      const { courseId } = createOrderSchema.parse(req.body);
      const result = await PaymentService.createOrder(courseId, req.user.userId);
      return sendSuccess(res, result, 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to create PayPal order";
      const statusCode = message === "Unauthorized"
        ? 401
        : message === "Course not found" || message === "PayPal order not found"
          ? 404
          : message === "Course already purchased" || message === "This course does not require PayPal payment"
            ? 409
            : 400;

      return sendError(res, message, statusCode);
    }
  }

  static async captureOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }

      const { orderId } = captureOrderSchema.parse(req.body);
      const enrollment = await PaymentService.captureOrder(orderId, req.user.userId);
      return sendSuccess(res, enrollment);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to capture PayPal order";
      const statusCode = message === "PayPal order not found"
        ? 404
        : message === "This PayPal order has already been captured"
          ? 409
          : 400;

      return sendError(res, message, statusCode);
    }
  }
}