"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentController = void 0;
const zod_1 = require("zod");
const enrollment_service_1 = require("../services/enrollment.service");
const response_1 = require("../utils/response");
const enrollment_validator_1 = require("../validators/enrollment.validator");
class EnrollmentController {
    static async enrollCourse(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendError)(res, "Unauthorized", 401);
            }
            const { courseId } = enrollment_validator_1.enrollCourseParamsSchema.parse(req.params);
            const enrollment = await enrollment_service_1.EnrollmentService.enrollCourse(req.user.userId, courseId);
            return (0, response_1.sendSuccess)(res, enrollment, 201);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to enroll course";
            const statusCode = message === "Course not found" ? 404 : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
    static async getUserEnrollments(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendError)(res, "Unauthorized", 401);
            }
            const enrollments = await enrollment_service_1.EnrollmentService.getUserEnrollments(req.user.userId);
            return (0, response_1.sendSuccess)(res, enrollments);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to get enrollments";
            return (0, response_1.sendError)(res, message, 500);
        }
    }
    static async confirmEnrollment(req, res) {
        try {
            const { id } = enrollment_validator_1.confirmEnrollmentParamsSchema.parse(req.params);
            const enrollment = await enrollment_service_1.EnrollmentService.confirmEnrollment(id, req.user?.role);
            return (0, response_1.sendSuccess)(res, enrollment);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to confirm enrollment";
            const statusCode = message === "Forbidden" ? 403 : message === "Enrollment not found" ? 404 : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
}
exports.EnrollmentController = EnrollmentController;
