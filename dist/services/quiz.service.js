"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const enrollment_repository_1 = require("../repositories/enrollment.repository");
class QuizService {
    static async submitQuiz(userId, lessonId, answers) {
        const lesson = await prisma_1.prisma.lesson.findUnique({
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
        const enrollment = await enrollment_repository_1.EnrollmentRepository.findByUserAndCourse(userId, lesson.chapter.courseId);
        if (!enrollment || enrollment.status !== client_1.EnrollmentStatus.CONFIRMED) {
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
exports.QuizService = QuizService;
