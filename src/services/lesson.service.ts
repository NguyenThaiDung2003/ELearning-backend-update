import { EnrollmentStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { EnrollmentRepository } from "../repositories/enrollment.repository";
import { ProgressRepository } from "../repositories/progress.repository";

export class LessonService {
  static async getLessonDetail(lessonId: string, userId?: string) {
    const lesson = await prisma.lesson.findUnique({
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
      ? await EnrollmentRepository.findByUserAndCourse(userId, lesson.chapter.course.id)
      : null;

    const hasAccess = lesson.isFree || enrollment?.status === EnrollmentStatus.CONFIRMED;
    const userProgress = userId
      ? await ProgressRepository.findByUserAndLesson(userId, lesson.id)
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