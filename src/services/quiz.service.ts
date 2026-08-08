import { EnrollmentStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { EnrollmentRepository } from "../repositories/enrollment.repository";

export class QuizService {
  static async submitQuiz(userId: string, lessonId: string, answers: number[]) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          select: {
            courseId: true,
          },
        },
        quizzes: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            question: true,
            correctAnswer: true,
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

    const results = lesson.quizzes.map((quiz, index) => {
      const submittedAnswer = answers[index];
      const isCorrect = submittedAnswer === quiz.correctAnswer;

      return {
        quizId: quiz.id,
        question: quiz.question,
        submittedAnswer,
        correct: isCorrect,
      };
    });

    const score = results.filter((result) => result.correct).length;

    return {
      score,
      total: lesson.quizzes.length,
      results,
    };
  }
}