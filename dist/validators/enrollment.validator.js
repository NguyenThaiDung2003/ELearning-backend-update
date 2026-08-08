"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEnrollmentParamsSchema = exports.enrollCourseParamsSchema = void 0;
const zod_1 = require("zod");
exports.enrollCourseParamsSchema = zod_1.z.object({
    courseId: zod_1.z.string().min(1, "Course id is required"),
});
exports.confirmEnrollmentParamsSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, "Enrollment id is required"),
});
