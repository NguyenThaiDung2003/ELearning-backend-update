"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressRepository = void 0;
const prisma_1 = require("../lib/prisma");
class ProgressRepository {
    static async findByUserAndLesson(userId, lessonId) {
        return prisma_1.prisma.userProgress.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        });
    }
    static async upsertProgress(userId, lessonId, completed, watchedSeconds) {
        return prisma_1.prisma.userProgress.upsert({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
            create: {
                userId,
                lessonId,
                completed,
                watchedSeconds,
            },
            update: {
                completed,
                watchedSeconds,
            },
        });
    }
    static async findCourseProgress(userId, courseId) {
        const [completedLessons, totalLessons] = await Promise.all([
            prisma_1.prisma.userProgress.count({
                where: {
                    userId,
                    completed: true,
                    lesson: {
                        chapter: {
                            courseId,
                        },
                    },
                },
            }),
            prisma_1.prisma.lesson.count({
                where: {
                    chapter: {
                        courseId,
                    },
                },
            }),
        ]);
        const percentage = totalLessons === 0
            ? 0
            : Number(((completedLessons / totalLessons) * 100).toFixed(2));
        return {
            completedLessons,
            totalLessons,
            percentage,
        };
    }
}
exports.ProgressRepository = ProgressRepository;
