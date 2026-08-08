import { Response } from "express";
import { ZodError } from "zod";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ProgressService } from "../services/progress.service";
import { sendError, sendSuccess } from "../utils/response";
import {
  getCourseProgressParamsSchema,
  updateProgressSchema,
} from "../validators/progress.validator";

export class ProgressController {
  static async updateProgress(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }

      const body = updateProgressSchema.parse(req.body);
      const progress = await ProgressService.updateProgress(req.user.userId, body.lessonId, {
        completed: body.completed,
        watchedSeconds: body.watchedSeconds,
      });

      return sendSuccess(res, progress);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to update progress";
      const statusCode = message === "Forbidden" ? 403 : message === "Lesson not found" ? 404 : 400;
      return sendError(res, message, statusCode);
    }
  }

  static async getCourseProgress(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }

      const { courseId } = getCourseProgressParamsSchema.parse(req.params);
      const progress = await ProgressService.getCourseProgress(req.user.userId, courseId);
      return sendSuccess(res, progress);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to get course progress";
      const statusCode = message === "Forbidden" ? 403 : 400;
      return sendError(res, message, statusCode);
    }
  }
}