import { CourseStatus, EnrollmentStatus, Prisma } from "@prisma/client";
import { Response } from "express";
import { ZodError } from "zod";

import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { sendError, sendSuccess } from "../utils/response";
import { slugify } from "../utils/slugify";
import {
  adminCourseListQuerySchema,
  adminEnrollmentListQuerySchema,
  adminUserListQuerySchema,
  createAdminCourseSchema,
  createChapterSchema,
  createLessonSchema,
  updateAdminCourseSchema,
  updateChapterSchema,
  updateLessonSchema,
  updateUserRoleSchema,
} from "../validators/admin.validator";

const getSingleValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getPagination = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

const normalizeSearch = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const handleZodError = (res: Response, error: unknown) => {
  if (error instanceof ZodError) {
    return sendError(res, error.issues.map((issue) => issue.message).join(", "), 400);
  }

  return null;
};

const buildCourseWhere = (status?: CourseStatus, search?: string): Prisma.CourseWhereInput => ({
  ...(status ? { status } : {}),
  ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
});

const buildEnrollmentWhere = (status?: EnrollmentStatus, search?: string): Prisma.EnrollmentWhereInput => ({
  ...(status ? { status } : {}),
  ...(search
    ? {
        user: {
          is: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      }
    : {}),
});

const buildUserWhere = (role: "ALL" | "STUDENT" | "ADMIN", search?: string): Prisma.UserWhereInput => ({
  ...(role !== "ALL" ? { role } : {}),
  ...(search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {}),
});

const generateUniqueCourseSlug = async (title: string, excludeCourseId?: string) => {
  const baseSlug = slugify(title);
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existingCourse = await prisma.course.findFirst({
      where: {
        urlSlug: candidate,
        ...(excludeCourseId ? { NOT: { id: excludeCourseId } } : {}),
      },
      select: { id: true },
    });

    if (!existingCourse) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

export class AdminController {
  static async getStats(_req: AuthenticatedRequest, res: Response) {
    try {
      const [totalUsers, totalCourses, totalEnrollments, pendingEnrollments, confirmedEnrollments] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.enrollment.count({ where: { status: EnrollmentStatus.PENDING } }),
        prisma.enrollment.findMany({
          where: { status: EnrollmentStatus.CONFIRMED },
          select: { course: { select: { price: true } } },
        }),
      ]);

      const totalRevenue = confirmedEnrollments.reduce((sum, enrollment) => sum + enrollment.course.price, 0);

      return sendSuccess(res, {
        totalUsers,
        totalCourses,
        totalEnrollments,
        pendingEnrollments,
        totalRevenue,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get stats";
      return sendError(res, message, 500);
    }
  }

  static async getCourses(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = adminCourseListQuerySchema.parse(req.query);
      const search = normalizeSearch(parsed.search);
      const where = buildCourseWhere(parsed.status, search);

      const [items, total] = await Promise.all([
        prisma.course.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (parsed.page - 1) * parsed.limit,
          take: parsed.limit,
          include: { _count: { select: { enrollments: true } } },
        }),
        prisma.course.count({ where }),
      ]);

      return sendSuccess(res, {
        items,
        pagination: getPagination(parsed.page, parsed.limit, total),
      });
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to get courses";
      return sendError(res, message, 500);
    }
  }

  static async createCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const body = createAdminCourseSchema.parse(req.body);
      const urlSlug = await generateUniqueCourseSlug(body.title);

      const course = await prisma.course.create({
        data: {
          title: body.title,
          description: body.description,
          price: body.price,
          isFree: body.isFree,
          level: body.level,
          thumbnail: body.thumbnail,
          urlSlug,
          status: CourseStatus.DRAFT,
        },
      });

      return sendSuccess(res, course, 201);
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to create course";
      return sendError(res, message, 400);
    }
  }

  static async updateCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Course id is required", 400);

      const body = updateAdminCourseSchema.parse(req.body);
      const existingCourse = await prisma.course.findUnique({ where: { id } });
      if (!existingCourse) return sendError(res, "Course not found", 404);

      const nextIsFree = body.isFree ?? existingCourse.isFree;
      const urlSlug = body.title ? await generateUniqueCourseSlug(body.title, id) : undefined;

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.thumbnail !== undefined ? { thumbnail: body.thumbnail } : {}),
          ...(body.level !== undefined ? { level: body.level } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.isFree !== undefined ? { isFree: body.isFree } : {}),
          ...((body.price !== undefined || body.isFree !== undefined)
            ? { price: nextIsFree ? 0 : body.price ?? existingCourse.price }
            : {}),
          ...(urlSlug ? { urlSlug } : {}),
        },
      });

      return sendSuccess(res, updatedCourse);
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to update course";
      return sendError(res, message, 400);
    }
  }

  static async publishCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Course id is required", 400);

      const [course, lessonCount] = await Promise.all([
        prisma.course.findUnique({ where: { id } }),
        prisma.lesson.count({ where: { chapter: { courseId: id } } }),
      ]);

      if (!course) return sendError(res, "Course not found", 404);
      if (lessonCount === 0) return sendError(res, "Khóa học phải có ít nhất 1 bài học", 400);

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: { status: CourseStatus.PUBLISHED },
      });

      return sendSuccess(res, updatedCourse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish course";
      return sendError(res, message, 400);
    }
  }

  static async unpublishCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Course id is required", 400);

      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) return sendError(res, "Course not found", 404);

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: { status: CourseStatus.DRAFT },
      });

      return sendSuccess(res, updatedCourse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to unpublish course";
      return sendError(res, message, 400);
    }
  }

  static async deleteCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Course id is required", 400);

      const [course, confirmedEnrollments] = await Promise.all([
        prisma.course.findUnique({ where: { id } }),
        prisma.enrollment.count({ where: { courseId: id, status: EnrollmentStatus.CONFIRMED } }),
      ]);

      if (!course) return sendError(res, "Course not found", 404);
      if (confirmedEnrollments > 0) {
        return sendError(res, "Cannot delete course with confirmed enrollments", 400);
      }

      await prisma.course.delete({ where: { id } });
      return sendSuccess(res, { message: "Course deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete course";
      return sendError(res, message, 400);
    }
  }
  static async createChapter(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = getSingleValue(req.params.courseId);
      if (!courseId) return sendError(res, "Course id is required", 400);

      const body = createChapterSchema.parse(req.body);
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return sendError(res, "Course not found", 404);

      const chapter = await prisma.chapter.create({
        data: {
          title: body.title,
          order: body.order,
          courseId,
        },
      });

      return sendSuccess(res, chapter, 201);
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to create chapter";
      return sendError(res, message, 400);
    }
  }

  static async updateChapter(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Chapter id is required", 400);

      const body = updateChapterSchema.parse(req.body);
      const chapter = await prisma.chapter.findUnique({ where: { id } });
      if (!chapter) return sendError(res, "Chapter not found", 404);

      const updatedChapter = await prisma.chapter.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.order !== undefined ? { order: body.order } : {}),
        },
      });

      return sendSuccess(res, updatedChapter);
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to update chapter";
      return sendError(res, message, 400);
    }
  }

  static async deleteChapter(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Chapter id is required", 400);

      const chapter = await prisma.chapter.findUnique({ where: { id } });
      if (!chapter) return sendError(res, "Chapter not found", 404);

      await prisma.chapter.delete({ where: { id } });
      return sendSuccess(res, { message: "Chapter deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete chapter";
      return sendError(res, message, 400);
    }
  }

  static async createLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const chapterId = getSingleValue(req.params.chapterId);
      if (!chapterId) return sendError(res, "Chapter id is required", 400);

      const body = createLessonSchema.parse(req.body);
      const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
      if (!chapter) return sendError(res, "Chapter not found", 404);

      const lesson = await prisma.lesson.create({
        data: {
          title: body.title,
          description: body.description,
          videoUrl: body.videoUrl,
          duration: body.duration,
          order: body.order,
          isFree: body.isFree,
          chapterId,
        },
      });

      return sendSuccess(res, lesson, 201);
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to create lesson";
      return sendError(res, message, 400);
    }
  }

  static async updateLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Lesson id is required", 400);

      const body = updateLessonSchema.parse(req.body);
      const lesson = await prisma.lesson.findUnique({ where: { id } });
      if (!lesson) return sendError(res, "Lesson not found", 404);

      const updatedLesson = await prisma.lesson.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.videoUrl !== undefined ? { videoUrl: body.videoUrl } : {}),
          ...(body.duration !== undefined ? { duration: body.duration } : {}),
          ...(body.order !== undefined ? { order: body.order } : {}),
          ...(body.isFree !== undefined ? { isFree: body.isFree } : {}),
        },
      });

      return sendSuccess(res, updatedLesson);
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to update lesson";
      return sendError(res, message, 400);
    }
  }

  static async deleteLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Lesson id is required", 400);

      const lesson = await prisma.lesson.findUnique({ where: { id } });
      if (!lesson) return sendError(res, "Lesson not found", 404);

      await prisma.lesson.delete({ where: { id } });
      return sendSuccess(res, { message: "Lesson deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete lesson";
      return sendError(res, message, 400);
    }
  }
  static async getEnrollments(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = adminEnrollmentListQuerySchema.parse(req.query);
      const search = normalizeSearch(parsed.search);
      const where = buildEnrollmentWhere(parsed.status, search);

      const [items, total] = await Promise.all([
        prisma.enrollment.findMany({
          where,
          skip: (parsed.page - 1) * parsed.limit,
          take: parsed.limit,
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          include: {
            user: { select: { name: true, email: true, avatar: true } },
            course: { select: { title: true, price: true } },
          },
        }),
        prisma.enrollment.count({ where }),
      ]);

      return sendSuccess(res, {
        items,
        pagination: getPagination(parsed.page, parsed.limit, total),
      });
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to get enrollments";
      return sendError(res, message, 500);
    }
  }

  static async confirmEnrollment(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Enrollment id is required", 400);

      const enrollment = await prisma.enrollment.findUnique({ where: { id } });
      if (!enrollment) return sendError(res, "Enrollment not found", 404);

      const updatedEnrollment = await prisma.enrollment.update({
        where: { id },
        data: { status: EnrollmentStatus.CONFIRMED },
        include: {
          user: { select: { name: true, email: true, avatar: true } },
          course: { select: { title: true, price: true } },
        },
      });

      return sendSuccess(res, updatedEnrollment);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to confirm enrollment";
      return sendError(res, message, 400);
    }
  }

  static async cancelEnrollment(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "Enrollment id is required", 400);

      const enrollment = await prisma.enrollment.findUnique({ where: { id } });
      if (!enrollment) return sendError(res, "Enrollment not found", 404);

      const updatedEnrollment = await prisma.enrollment.update({
        where: { id },
        data: { status: EnrollmentStatus.CANCELLED },
        include: {
          user: { select: { name: true, email: true, avatar: true } },
          course: { select: { title: true, price: true } },
        },
      });

      return sendSuccess(res, updatedEnrollment);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel enrollment";
      return sendError(res, message, 400);
    }
  }

  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = adminUserListQuerySchema.parse(req.query);
      const search = normalizeSearch(parsed.search);
      const where = buildUserWhere(parsed.role, search);

      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (parsed.page - 1) * parsed.limit,
          take: parsed.limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { enrollments: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return sendSuccess(res, {
        items,
        pagination: getPagination(parsed.page, parsed.limit, total),
      });
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to get users";
      return sendError(res, message, 500);
    }
  }

  static async updateUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getSingleValue(req.params.id);
      if (!id) return sendError(res, "User id is required", 400);
      if (req.user?.userId === id) {
        return sendError(res, "Khong cho phep thay doi role cua chinh minh", 400);
      }

      const { role } = updateUserRoleSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return sendError(res, "User not found", 404);

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return sendSuccess(res, updatedUser);
    } catch (error) {
      const zodResponse = handleZodError(res, error);
      if (zodResponse) return zodResponse;
      const message = error instanceof Error ? error.message : "Failed to update user role";
      return sendError(res, message, 400);
    }
  }
}
