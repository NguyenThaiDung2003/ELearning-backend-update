"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const progress_repository_1 = require("../repositories/progress.repository");
class ProgressService {
    static async updateProgress(userId, lessonId, payload) {
        const lesson = await prisma_1.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                chapter: {
                    select: {
                        courseId: true,
                    },
                },
            },
        });
        if (!lesson) {
            throw new Error("Lesson not found");
        }
        const enrollment = await enrollment_repository_1.EnrollmentRepository.findByUserAndCourse(userId, lesson.chapter.courseId);
        if (!enrollment || enrollment.status !== client_1.EnrollmentStatus.CONFIRMED) {
            throw new Error("Forbidden");
        }
        return progress_repository_1.ProgressRepository.upsertProgress(userId, lessonId, payload.completed, payload.watchedSeconds);
    }
    static async getCourseProgress(userId, courseId) {
        const enrollment = await enrollment_repository_1.EnrollmentRepository.findByUserAndCourse(userId, courseId);
        if (!enrollment || enrollment.status !== client_1.EnrollmentStatus.CONFIRMED) {
            throw new Error("Forbidden");
        }
        return progress_repository_1.ProgressRepository.findCourseProgress(userId, courseId);
    }
}
exports.ProgressService = ProgressService;
