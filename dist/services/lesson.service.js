"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const progress_repository_1 = require("../repositories/progress.repository");
class LessonService {
    static async getLessonDetail(lessonId, userId) {
        const lesson = await prisma_1.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                chapter: {
                    select: {
                        id: true,
                        title: true,
                        order: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                                urlSlug: true,
                            },
                        },
                    },
                },
                quizzes: {
                    orderBy: { id: "asc" },
                    select: {
                        id: true,
                        question: true,
                        options: true,
                    },
                },
            },
        });
        if (!lesson) {
            throw new Error("Lesson not found");
        }
        const enrollment = userId
            ? await enrollment_repository_1.EnrollmentRepository.findByUserAndCourse(userId, lesson.chapter.course.id)
            : null;
        const hasAccess = lesson.isFree || enrollment?.status === client_1.EnrollmentStatus.CONFIRMED;
        const userProgress = userId
            ? await progress_repository_1.ProgressRepository.findByUserAndLesson(userId, lesson.id)
            : null;
        return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            order: lesson.order,
            isFree: lesson.isFree,
            videoUrl: hasAccess ? lesson.videoUrl : null,
            chapter: lesson.chapter,
            quizzes: lesson.quizzes,
            userProgress,
        };
    }
}
exports.LessonService = LessonService;
