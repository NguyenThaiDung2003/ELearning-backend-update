"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonController = void 0;
const lesson_service_1 = require("../services/lesson.service");
const response_1 = require("../utils/response");
const getSingleParam = (value) => Array.isArray(value) ? value[0] : value;
class LessonController {
    static async getLessonDetail(req, res) {
        try {
            const lessonId = getSingleParam(req.params.lessonId);
            if (!lessonId) {
                return (0, response_1.sendError)(res, "Lesson id is required", 400);
            }
            const lesson = await lesson_service_1.LessonService.getLessonDetail(lessonId, req.user?.userId);
            return (0, response_1.sendSuccess)(res, lesson);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to get lesson detail";
            const statusCode = message === "Lesson not found" ? 404 : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
}
exports.LessonController = LessonController;
