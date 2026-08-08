import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { LessonService } from "../services/lesson.service";
import { sendError, sendSuccess } from "../utils/response";

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export class LessonController {
  static async getLessonDetail(req: AuthenticatedRequest, res: Response) {
    try {
      const lessonId = getSingleParam(req.params.lessonId);
      if (!lessonId) {
        return sendError(res, "Lesson id is required", 400);
      }

      const lesson = await LessonService.getLessonDetail(lessonId, req.user?.userId);
      return sendSuccess(res, lesson);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get lesson detail";
      const statusCode = message === "Lesson not found" ? 404 : 400;
      return sendError(res, message, statusCode);
    }
  }
}