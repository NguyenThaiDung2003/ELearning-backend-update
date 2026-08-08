import { Response } from "express";
import { ZodError } from "zod";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { QuizService } from "../services/quiz.service";
import { sendError, sendSuccess } from "../utils/response";
import { submitQuizSchema } from "../validators/quiz.validator";

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export class QuizController {
  static async submitQuiz(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, "Unauthorized", 401);
      }

      const lessonId = getSingleParam(req.params.lessonId);
      if (!lessonId) {
        return sendError(res, "Lesson id is required", 400);
      }

      const { answers } = submitQuizSchema.parse(req.body);
      const result = await QuizService.submitQuiz(req.user.userId, lessonId, answers);
      return sendSuccess(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to submit quiz";
      const statusCode = message === "Forbidden" ? 403 : message === "Lesson not found" ? 404 : 400;
      return sendError(res, message, statusCode);
    }
  }
}