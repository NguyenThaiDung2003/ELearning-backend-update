"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseProgressParamsSchema = exports.updateProgressSchema = void 0;
const zod_1 = require("zod");
exports.updateProgressSchema = zod_1.z.object({
    lessonId: zod_1.z.string().min(1, "Lesson id is required"),
    completed: zod_1.z.boolean(),
    watchedSeconds: zod_1.z.number().int().min(0, "Watched seconds must be greater than or equal to 0"),
});
exports.getCourseProgressParamsSchema = zod_1.z.object({
    courseId: zod_1.z.string().min(1, "Course id is required"),
});
