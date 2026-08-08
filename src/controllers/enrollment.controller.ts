import { Response } from "express";
import { ZodError } from "zod";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { EnrollmentService } from "../services/enrollment.service";
import { sendError, sendSuccess } from "../utils/response";
import {
  confirmEnrollmentParamsSchema,
  enrollCourseParamsSchema,
} from "../validators/enrollment.validator";

export class EnrollmentController {
  static async enrollCourse(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }

      const { courseId } = enrollCourseParamsSchema.parse(req.params);
      const enrollment = await EnrollmentService.enrollCourse(req.user.userId, courseId);
      return sendSuccess(res, enrollment, 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to enroll course";
      const statusCode = message === "Course not found" ? 404 : 400;
      return sendError(res, message, statusCode);
    }
  }

  static async getUserEnrollments(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }

      const enrollments = await EnrollmentService.getUserEnrollments(req.user.userId);
      return sendSuccess(res, enrollments);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get enrollments";
      return sendError(res, message, 500);
    }
  }

  static async confirmEnrollment(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = confirmEnrollmentParamsSchema.parse(req.params);
      const enrollment = await EnrollmentService.confirmEnrollment(id, req.user?.role);
      return sendSuccess(res, enrollment);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to confirm enrollment";
      const statusCode = message === "Forbidden" ? 403 : message === "Enrollment not found" ? 404 : 400;
      return sendError(res, message, statusCode);
    }
  }
}