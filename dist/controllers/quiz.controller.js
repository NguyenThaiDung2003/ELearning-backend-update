"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizController = void 0;
const zod_1 = require("zod");
const quiz_service_1 = require("../services/quiz.service");
const response_1 = require("../utils/response");
const quiz_validator_1 = require("../validators/quiz.validator");
const getSingleParam = (value) => Array.isArray(value) ? value[0] : value;
class QuizController {
    static async submitQuiz(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendError)(res, "Unauthorized", 401);
            }
            const lessonId = getSingleParam(req.params.lessonId);
            if (!lessonId) {
                return (0, response_1.sendError)(res, "Lesson id is required", 400);
            }
            const { answers } = quiz_validator_1.submitQuizSchema.parse(req.body);
            const result = await quiz_service_1.QuizService.submitQuiz(req.user.userId, lessonId, answers);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to submit quiz";
            const statusCode = message === "Forbidden" ? 403 : message === "Lesson not found" ? 404 : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
}
exports.QuizController = QuizController;
