import { Request, Response } from "express";
import { ZodError } from "zod";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { CourseService } from "../services/course.service";
import { sendError, sendSuccess } from "../utils/response";
import {
  createCourseSchema,
  getCoursesQuerySchema,
  updateCourseSchema,
} from "../validators/course.validator";

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export class CourseController {
  static async getCourses(req: Request, res: Response) {
    try {
      const query = getCoursesQuerySchema.parse(req.query);
      const result = await CourseService.getCourses(query);
      return sendSuccess(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to get courses";
      return sendError(res, message, 500);
    }
  }

  static async getCourseBySlug(req: AuthenticatedRequest, res: Response) {
    try {
      const slug = getSingleParam(req.params.slug);
      if (!slug) {
        return sendError(res, "Course slug is required", 400);
      }

      const course = await CourseService.getCourseBySlug(slug, req.user?.userId);
      return sendSuccess(res, course);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get course";
      const statusCode = message === "Course not found" ? 404 : 500;
      return sendError(res, message, statusCode);
    }
  }

  static async createCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const body = createCourseSchema.parse(req.body);
      const course = await CourseService.createCourse(body, req.user?.role);
      return sendSuccess(res, course, 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to create course";
      const statusCode = message === "Forbidden" ? 403 : 400;
      return sendError(res, message, statusCode);
    }
  }

  static async updateCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleParam(req.params.id);
      if (!id) {
        return sendError(res, "Course id is required", 400);
      }

      const body = updateCourseSchema.parse(req.body);
      const course = await CourseService.updateCourse(id, body, req.user?.role);
      return sendSuccess(res, course);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
      }

      const message = error instanceof Error ? error.message : "Failed to update course";
      const statusCode = message === "Forbidden" ? 403 : message === "Course not found" ? 404 : 400;
      return sendError(res, message, statusCode);
    }
  }

  static async deleteCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleParam(req.params.id);
      if (!id) {
        return sendError(res, "Course id is required", 400);
      }

      await CourseService.deleteCourse(id, req.user?.role);
      return sendSuccess(res, { message: "Course deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete course";
      const statusCode = message === "Forbidden" ? 403 : message === "Course not found" ? 404 : 400;
      return sendError(res, message, statusCode);
    }
  }
}