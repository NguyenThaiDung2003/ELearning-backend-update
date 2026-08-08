import { EnrollmentStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { EnrollmentRepository } from "../repositories/enrollment.repository";
import { ProgressRepository } from "../repositories/progress.repository";

interface UpdateProgressInput {
  completed: boolean;
  watchedSeconds: number;
}

export class ProgressService {
  static async updateProgress(userId: string, lessonId: string, payload: UpdateProgressInput) {
    const lesson = await prisma.lesson.findUnique({
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

    const enrollment = await EnrollmentRepository.findByUserAndCourse(userId, lesson.chapter.courseId);
    if (!enrollment || enrollment.status !== EnrollmentStatus.CONFIRMED) {
      throw new Error("Forbidden");
    }

    return ProgressRepository.upsertProgress(
      userId,
      lessonId,
      payload.completed,
      payload.watchedSeconds,
    );
  }

  static async getCourseProgress(userId: string, courseId: string) {
    const enrollment = await EnrollmentRepository.findByUserAndCourse(userId, courseId);
    if (!enrollment || enrollment.status !== EnrollmentStatus.CONFIRMED) {
      throw new Error("Forbidden");
    }

    return ProgressRepository.findCourseProgress(userId, courseId);
  }
}