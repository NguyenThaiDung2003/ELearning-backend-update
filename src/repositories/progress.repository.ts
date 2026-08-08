import { prisma } from "../lib/prisma";

export class ProgressRepository {
  static async findByUserAndLesson(userId: string, lessonId: string) {
    return prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });
  }

  static async upsertProgress(
    userId: string,
    lessonId: string,
    completed: boolean,
    watchedSeconds: number,
  ) {
    return prisma.userProgress.upsert({
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

  static async findCourseProgress(userId: string, courseId: string) {
    const [completedLessons, totalLessons] = await Promise.all([
      prisma.userProgress.count({
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
      prisma.lesson.count({
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