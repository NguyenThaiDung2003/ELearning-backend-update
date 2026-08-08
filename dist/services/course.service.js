"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseService = void 0;
const client_1 = require("@prisma/client");
const course_repository_1 = require("../repositories/course.repository");
const enrollment_repository_1 = require("../repositories/enrollment.repository");
class CourseService {
    static async getCourses(query) {
        const [courses, total] = await Promise.all([
            course_repository_1.CourseRepository.findAllPublished(query),
            course_repository_1.CourseRepository.countAll({ search: query.search, level: query.level }),
        ]);
        return {
            items: courses,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    static async getCourseBySlug(slug, userId) {
        const course = await course_repository_1.CourseRepository.findBySlug(slug);
        if (!course) {
            throw new Error("Course not found");
        }
        const enrollment = userId
            ? await enrollment_repository_1.EnrollmentRepository.findByUserAndCourse(userId, course.id)
            : null;
        const hasFullAccess = enrollment?.status === "CONFIRMED";
        return {
            ...course,
            chapters: course.chapters.map((chapter) => ({
                ...chapter,
                lessons: chapter.lessons.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    order: lesson.order,
                    isFree: lesson.isFree,
                    duration: lesson.duration,
                    videoUrl: lesson.isFree || hasFullAccess ? lesson.videoUrl : null,
                })),
            })),
        };
    }
    static async createCourse(data, role) {
        this.ensureAdmin(role);
        const payload = {
            title: data.title,
            description: data.description,
            thumbnail: data.thumbnail ?? null,
            price: data.isFree ? 0 : data.price ?? 0,
            isFree: data.isFree ?? false,
            urlSlug: data.urlSlug,
            level: data.level,
            status: data.status ?? client_1.CourseStatus.DRAFT,
        };
        return course_repository_1.CourseRepository.create(payload);
    }
    static async updateCourse(id, data, role) {
        this.ensureAdmin(role);
        const existingCourse = await course_repository_1.CourseRepository.findById(id);
        if (!existingCourse) {
            throw new Error("Course not found");
        }
        const isFree = data.isFree ?? existingCourse.isFree;
        const payload = {
            ...(data.title !== undefined ? { title: data.title } : {}),
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.thumbnail !== undefined ? { thumbnail: data.thumbnail } : {}),
            ...(data.price !== undefined || data.isFree !== undefined
                ? { price: isFree ? 0 : data.price ?? existingCourse.price }
                : {}),
            ...(data.isFree !== undefined ? { isFree: data.isFree } : {}),
            ...(data.urlSlug !== undefined ? { urlSlug: data.urlSlug } : {}),
            ...(data.level !== undefined ? { level: data.level } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
        };
        return course_repository_1.CourseRepository.update(id, payload);
    }
    static async deleteCourse(id, role) {
        this.ensureAdmin(role);
        const existingCourse = await course_repository_1.CourseRepository.findById(id);
        if (!existingCourse) {
            throw new Error("Course not found");
        }
        return course_repository_1.CourseRepository.delete(id);
    }
    static ensureAdmin(role) {
        if (role !== client_1.UserRole.ADMIN) {
            throw new Error("Forbidden");
        }
    }
}
exports.CourseService = CourseService;
