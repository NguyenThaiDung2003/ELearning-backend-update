"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressController = void 0;
const zod_1 = require("zod");
const progress_service_1 = require("../services/progress.service");
const response_1 = require("../utils/response");
const progress_validator_1 = require("../validators/progress.validator");
class ProgressController {
    static async updateProgress(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendError)(res, "Unauthorized", 401);
            }
            const body = progress_validator_1.updateProgressSchema.parse(req.body);
            const progress = await progress_service_1.ProgressService.updateProgress(req.user.userId, body.lessonId, {
                completed: body.completed,
                watchedSeconds: body.watchedSeconds,
            });
            return (0, response_1.sendSuccess)(res, progress);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to update progress";
            const statusCode = message === "Forbidden" ? 403 : message === "Lesson not found" ? 404 : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
    static async getCourseProgress(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendError)(res, "Unauthorized", 401);
            }
            const { courseId } = progress_validator_1.getCourseProgressParamsSchema.parse(req.params);
            const progress = await progress_service_1.ProgressService.getCourseProgress(req.user.userId, courseId);
            return (0, response_1.sendSuccess)(res, progress);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to get course progress";
            const statusCode = message === "Forbidden" ? 403 : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
}
exports.ProgressController = ProgressController;
