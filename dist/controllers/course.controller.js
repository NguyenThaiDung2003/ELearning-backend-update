"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseController = void 0;
const zod_1 = require("zod");
const course_service_1 = require("../services/course.service");
const response_1 = require("../utils/response");
const course_validator_1 = require("../validators/course.validator");
const getSingleParam = (value) => Array.isArray(value) ? value[0] : value;
class CourseController {
    static async getCourses(req, res) {
        try {
            const query = course_validator_1.getCoursesQuerySchema.parse(req.query);
            const result = await course_service_1.CourseService.getCourses(query);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to get courses";
            return (0, response_1.sendError)(res, message, 500);
        }
    }
    static async getCourseBySlug(req, res) {
        try {
            const slug = getSingleParam(req.params.slug);
            if (!slug) {
                return (0, response_1.sendError)(res, "Course slug is required", 400);
            }
            const course = await course_service_1.CourseService.getCourseBySlug(slug, req.user?.userId);
            return (0, response_1.sendSuccess)(res, course);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to get course";
            const statusCode = message === "Course not found" ? 404 : 500;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
    static async createCourse(req, res) {
        try {
            const body = course_validator_1.createCourseSchema.parse(req.body);
            const course = await course_service_1.CourseService.createCourse(body, req.user?.role);
            return (0, response_1.sendSuccess)(res, course, 201);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to create course";
            const statusCode = message === "Forbidden" ? 403 : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
    static async updateCourse(req, res) {
        try {
            const id = getSingleParam(req.params.id);
            if (!id) {
                return (0, response_1.sendError)(res, "Course id is required", 400);
            }
            const body = course_validator_1.updateCourseSchema.parse(req.body);
            const course = await course_service_1.CourseService.updateCourse(id, body, req.user?.role);
            return (0, response_1.sendSuccess)(res, course);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Failed to update course";
            const statusCode = message === "Forbidden" ? 403 : message === "Course not found" ? 404 : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
    static async deleteCourse(req, res) {
        try {
            const id = getSingleParam(req.params.id);
            if (!id) {
                return (0, response_1.sendError)(res, "Course id is required", 400);
            }
            await course_service_1.CourseService.deleteCourse(id, req.user?.role);
            return (0, response_1.sendSuccess)(res, { message: "Course deleted successfully" });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete course";
            const statusCode = message === "Forbidden" ? 403 : message === "Course not found" ? 404 : 400;
            return (0, response_1.sendError)(res, message, statusCode);
        }
    }
}
exports.CourseController = CourseController;
