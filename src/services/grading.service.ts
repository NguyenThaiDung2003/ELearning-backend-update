import { AssignmentType, Prisma, SubmissionStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";

interface GradableQuestion {
  id: string;
  correctAnswer: number;
}

type AnswerMap = Record<string, number>;

export const parseAnswers = (value: Prisma.JsonValue | null | undefined): AnswerMap => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<AnswerMap>((acc, [questionId, selected]) => {
    if (typeof selected === "number" && Number.isInteger(selected)) {
      acc[questionId] = selected;
    }

    return acc;
  }, {});
};

export const gradeQuiz = (
  questions: GradableQuestion[],
  answers: AnswerMap,
  maxScore: number,
) => {
  if (questions.length === 0) {
    return { correctCount: 0, totalQuestions: 0, score: 0 };
  }

  const correctCount = questions.filter(
    (question) => answers[question.id] === question.correctAnswer,
  ).length;

  const score = Math.round((correctCount / questions.length) * maxScore * 100) / 100;

  return { correctCount, totalQuestions: questions.length, score };
};

/**
 * Chot mot luot lam bai: quiz duoc cham ngay, bai thuc hanh cho giang vien cham.
 * Status giu lai cach nop (tu nop hay het gio) de bang diem hien thi dung.
 */
export const finalizeSubmission = async (submissionId: string, autoSubmitted: boolean) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { questions: true } } },
  });

  if (!submission) {
    return null;
  }

  const isQuiz = submission.assignment.type === AssignmentType.QUIZ;
  const grade = isQuiz
    ? gradeQuiz(
        submission.assignment.questions,
        parseAnswers(submission.answers),
        submission.assignment.maxScore,
      )
    : null;

  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: autoSubmitted ? SubmissionStatus.AUTO_SUBMITTED : SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
      ...(grade ? { score: grade.score } : {}),
    },
    include: { assignment: { select: { id: true, title: true, type: true, maxScore: true } } },
  });
};

/**
 * Nop thay cho nhung luot lam bai da het gio. Chay lazily moi khi co nguoi
 * xem bang diem, va dinh ky boi auto-submit job.
 */
export const autoSubmitExpired = async (assignmentId?: string) => {
  const expired = await prisma.submission.findMany({
    where: {
      status: SubmissionStatus.IN_PROGRESS,
      expiresAt: { not: null, lte: new Date() },
      ...(assignmentId ? { assignmentId } : {}),
    },
    select: { id: true },
  });

  for (const submission of expired) {
    await finalizeSubmission(submission.id, true);
  }

  return expired.length;
};
