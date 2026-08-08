"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const slugify_1 = require("../utils/slugify");
const admin_validator_1 = require("../validators/admin.validator");
const getSingleValue = (value) => Array.isArray(value) ? value[0] : value;
const getPagination = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});
const normalizeSearch = (value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
};
const handleZodError = (res, error) => {
    if (error instanceof zod_1.ZodError) {
        return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
    }
    return null;
};
const buildCourseWhere = (status, search) => ({
    ...(status ? { status } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
});
const buildEnrollmentWhere = (status, search) => ({
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
const buildUserWhere = (role, search) => ({
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
const generateUniqueCourseSlug = async (title, excludeCourseId) => {
    const baseSlug = (0, slugify_1.slugify)(title);
    let candidate = baseSlug;
    let suffix = 1;
    while (true) {
        const existingCourse = await prisma_1.prisma.course.findFirst({
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
class AdminController {
    static async getStats(_req, res) {
        try {
            const [totalUsers, totalCourses, totalEnrollments, pendingEnrollments, confirmedEnrollments] = await Promise.all([
                prisma_1.prisma.user.count(),
                prisma_1.prisma.course.count(),
                prisma_1.prisma.enrollment.count(),
                prisma_1.prisma.enrollment.count({ where: { status: client_1.EnrollmentStatus.PENDING } }),
                prisma_1.prisma.enrollment.findMany({
                    where: { status: client_1.EnrollmentStatus.CONFIRMED },
                    select: { course: { select: { price: true } } },
                }),
            ]);
            const totalRevenue = confirmedEnrollments.reduce((sum, enrollment) => sum + enrollment.course.price, 0);
            return (0, response_1.sendSuccess)(res, {
                totalUsers,
                totalCourses,
                totalEnrollments,
                pendingEnrollments,
                totalRevenue,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to get stats";
            return (0, response_1.sendError)(res, message, 500);
        }
    }
    static async getCourses(req, res) {
        try {
            const parsed = admin_validator_1.adminCourseListQuerySchema.parse(req.query);
            const search = normalizeSearch(parsed.search);
            const where = buildCourseWhere(parsed.status, search);
            const [items, total] = await Promise.all([
                prisma_1.prisma.course.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    skip: (parsed.page - 1) * parsed.limit,
                    take: parsed.limit,
                    include: { _count: { select: { enrollments: true } } },
                }),
                prisma_1.prisma.course.count({ where }),
            ]);
            return (0, response_1.sendSuccess)(res, {
                items,
                pagination: getPagination(parsed.page, parsed.limit, total),
            });
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to get courses";
            return (0, response_1.sendError)(res, message, 500);
        }
    }
    static async createCourse(req, res) {
        try {
            const body = admin_validator_1.createAdminCourseSchema.parse(req.body);
            const urlSlug = await generateUniqueCourseSlug(body.title);
            const course = await prisma_1.prisma.course.create({
                data: {
                    title: body.title,
                    description: body.description,
                    price: body.price,
                    isFree: body.isFree,
                    level: body.level,
                    thumbnail: body.thumbnail,
                    urlSlug,
                    status: client_1.CourseStatus.DRAFT,
                },
            });
            return (0, response_1.sendSuccess)(res, course, 201);
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to create course";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async updateCourse(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Course id is required", 400);
            const body = admin_validator_1.updateAdminCourseSchema.parse(req.body);
            const existingCourse = await prisma_1.prisma.course.findUnique({ where: { id } });
            if (!existingCourse)
                return (0, response_1.sendError)(res, "Course not found", 404);
            const nextIsFree = body.isFree ?? existingCourse.isFree;
            const urlSlug = body.title ? await generateUniqueCourseSlug(body.title, id) : undefined;
            const updatedCourse = await prisma_1.prisma.course.update({
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
            return (0, response_1.sendSuccess)(res, updatedCourse);
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to update course";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async publishCourse(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Course id is required", 400);
            const [course, lessonCount] = await Promise.all([
                prisma_1.prisma.course.findUnique({ where: { id } }),
                prisma_1.prisma.lesson.count({ where: { chapter: { courseId: id } } }),
            ]);
            if (!course)
                return (0, response_1.sendError)(res, "Course not found", 404);
            if (lessonCount === 0)
                return (0, response_1.sendError)(res, "Khóa học phải có ít nhất 1 bài học", 400);
            const updatedCourse = await prisma_1.prisma.course.update({
                where: { id },
                data: { status: client_1.CourseStatus.PUBLISHED },
            });
            return (0, response_1.sendSuccess)(res, updatedCourse);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to publish course";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async unpublishCourse(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Course id is required", 400);
            const course = await prisma_1.prisma.course.findUnique({ where: { id } });
            if (!course)
                return (0, response_1.sendError)(res, "Course not found", 404);
            const updatedCourse = await prisma_1.prisma.course.update({
                where: { id },
                data: { status: client_1.CourseStatus.DRAFT },
            });
            return (0, response_1.sendSuccess)(res, updatedCourse);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to unpublish course";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async deleteCourse(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Course id is required", 400);
            const [course, confirmedEnrollments] = await Promise.all([
                prisma_1.prisma.course.findUnique({ where: { id } }),
                prisma_1.prisma.enrollment.count({ where: { courseId: id, status: client_1.EnrollmentStatus.CONFIRMED } }),
            ]);
            if (!course)
                return (0, response_1.sendError)(res, "Course not found", 404);
            if (confirmedEnrollments > 0) {
                return (0, response_1.sendError)(res, "Cannot delete course with confirmed enrollments", 400);
            }
            await prisma_1.prisma.course.delete({ where: { id } });
            return (0, response_1.sendSuccess)(res, { message: "Course deleted successfully" });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete course";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async createChapter(req, res) {
        try {
            const courseId = getSingleValue(req.params.courseId);
            if (!courseId)
                return (0, response_1.sendError)(res, "Course id is required", 400);
            const body = admin_validator_1.createChapterSchema.parse(req.body);
            const course = await prisma_1.prisma.course.findUnique({ where: { id: courseId } });
            if (!course)
                return (0, response_1.sendError)(res, "Course not found", 404);
            const chapter = await prisma_1.prisma.chapter.create({
                data: {
                    title: body.title,
                    order: body.order,
                    courseId,
                },
            });
            return (0, response_1.sendSuccess)(res, chapter, 201);
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to create chapter";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async updateChapter(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Chapter id is required", 400);
            const body = admin_validator_1.updateChapterSchema.parse(req.body);
            const chapter = await prisma_1.prisma.chapter.findUnique({ where: { id } });
            if (!chapter)
                return (0, response_1.sendError)(res, "Chapter not found", 404);
            const updatedChapter = await prisma_1.prisma.chapter.update({
                where: { id },
                data: {
                    ...(body.title !== undefined ? { title: body.title } : {}),
                    ...(body.order !== undefined ? { order: body.order } : {}),
                },
            });
            return (0, response_1.sendSuccess)(res, updatedChapter);
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to update chapter";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async deleteChapter(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Chapter id is required", 400);
            const chapter = await prisma_1.prisma.chapter.findUnique({ where: { id } });
            if (!chapter)
                return (0, response_1.sendError)(res, "Chapter not found", 404);
            await prisma_1.prisma.chapter.delete({ where: { id } });
            return (0, response_1.sendSuccess)(res, { message: "Chapter deleted successfully" });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete chapter";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async createLesson(req, res) {
        try {
            const chapterId = getSingleValue(req.params.chapterId);
            if (!chapterId)
                return (0, response_1.sendError)(res, "Chapter id is required", 400);
            const body = admin_validator_1.createLessonSchema.parse(req.body);
            const chapter = await prisma_1.prisma.chapter.findUnique({ where: { id: chapterId } });
            if (!chapter)
                return (0, response_1.sendError)(res, "Chapter not found", 404);
            const lesson = await prisma_1.prisma.lesson.create({
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
            return (0, response_1.sendSuccess)(res, lesson, 201);
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to create lesson";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async updateLesson(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Lesson id is required", 400);
            const body = admin_validator_1.updateLessonSchema.parse(req.body);
            const lesson = await prisma_1.prisma.lesson.findUnique({ where: { id } });
            if (!lesson)
                return (0, response_1.sendError)(res, "Lesson not found", 404);
            const updatedLesson = await prisma_1.prisma.lesson.update({
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
            return (0, response_1.sendSuccess)(res, updatedLesson);
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to update lesson";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async deleteLesson(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Lesson id is required", 400);
            const lesson = await prisma_1.prisma.lesson.findUnique({ where: { id } });
            if (!lesson)
                return (0, response_1.sendError)(res, "Lesson not found", 404);
            await prisma_1.prisma.lesson.delete({ where: { id } });
            return (0, response_1.sendSuccess)(res, { message: "Lesson deleted successfully" });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete lesson";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async getEnrollments(req, res) {
        try {
            const parsed = admin_validator_1.adminEnrollmentListQuerySchema.parse(req.query);
            const search = normalizeSearch(parsed.search);
            const where = buildEnrollmentWhere(parsed.status, search);
            const [items, total] = await Promise.all([
                prisma_1.prisma.enrollment.findMany({
                    where,
                    skip: (parsed.page - 1) * parsed.limit,
                    take: parsed.limit,
                    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
                    include: {
                        user: { select: { name: true, email: true, avatar: true } },
                        course: { select: { title: true, price: true } },
                    },
                }),
                prisma_1.prisma.enrollment.count({ where }),
            ]);
            return (0, response_1.sendSuccess)(res, {
                items,
                pagination: getPagination(parsed.page, parsed.limit, total),
            });
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to get enrollments";
            return (0, response_1.sendError)(res, message, 500);
        }
    }
    static async confirmEnrollment(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Enrollment id is required", 400);
            const enrollment = await prisma_1.prisma.enrollment.findUnique({ where: { id } });
            if (!enrollment)
                return (0, response_1.sendError)(res, "Enrollment not found", 404);
            const updatedEnrollment = await prisma_1.prisma.enrollment.update({
                where: { id },
                data: { status: client_1.EnrollmentStatus.CONFIRMED },
                include: {
                    user: { select: { name: true, email: true, avatar: true } },
                    course: { select: { title: true, price: true } },
                },
            });
            return (0, response_1.sendSuccess)(res, updatedEnrollment);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to confirm enrollment";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async cancelEnrollment(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "Enrollment id is required", 400);
            const enrollment = await prisma_1.prisma.enrollment.findUnique({ where: { id } });
            if (!enrollment)
                return (0, response_1.sendError)(res, "Enrollment not found", 404);
            const updatedEnrollment = await prisma_1.prisma.enrollment.update({
                where: { id },
                data: { status: client_1.EnrollmentStatus.CANCELLED },
                include: {
                    user: { select: { name: true, email: true, avatar: true } },
                    course: { select: { title: true, price: true } },
                },
            });
            return (0, response_1.sendSuccess)(res, updatedEnrollment);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to cancel enrollment";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async getUsers(req, res) {
        try {
            const parsed = admin_validator_1.adminUserListQuerySchema.parse(req.query);
            const search = normalizeSearch(parsed.search);
            const where = buildUserWhere(parsed.role, search);
            const [items, total] = await Promise.all([
                prisma_1.prisma.user.findMany({
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
                prisma_1.prisma.user.count({ where }),
            ]);
            return (0, response_1.sendSuccess)(res, {
                items,
                pagination: getPagination(parsed.page, parsed.limit, total),
            });
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to get users";
            return (0, response_1.sendError)(res, message, 500);
        }
    }
    static async updateUserRole(req, res) {
        try {
            const id = getSingleValue(req.params.id);
            if (!id)
                return (0, response_1.sendError)(res, "User id is required", 400);
            if (req.user?.userId === id) {
                return (0, response_1.sendError)(res, "Khong cho phep thay doi role cua chinh minh", 400);
            }
            const { role } = admin_validator_1.updateUserRoleSchema.parse(req.body);
            const user = await prisma_1.prisma.user.findUnique({ where: { id } });
            if (!user)
                return (0, response_1.sendError)(res, "User not found", 404);
            const updatedUser = await prisma_1.prisma.user.update({
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
            return (0, response_1.sendSuccess)(res, updatedUser);
        }
        catch (error) {
            const zodResponse = handleZodError(res, error);
            if (zodResponse)
                return zodResponse;
            const message = error instanceof Error ? error.message : "Failed to update user role";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
}
exports.AdminController = AdminController;
