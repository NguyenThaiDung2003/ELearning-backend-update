import { AssignmentType, SubmissionStatus, UserRole } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { AssignmentRepository } from "../repositories/assignment.repository";
import { SubmissionRepository } from "../repositories/submission.repository";
import { badRequest, conflict, forbidden, notFound } from "../utils/errors";
import { resolveAssignmentState, resolveExpiresAt } from "../utils/assignment";
import { seededShuffle } from "../utils/shuffle";
import { Actor, assertClassAccess } from "./access.service";
import { finalizeSubmission, gradeQuiz, parseAnswers } from "./grading.service";
import {
  GradeSubmissionInput,
  SaveAnswersInput,
  SubmitPracticalInput,
} from "../validators/submission.validator";

const FINISHED_STATUSES: SubmissionStatus[] = [
  SubmissionStatus.SUBMITTED,
  SubmissionStatus.AUTO_SUBMITTED,
  SubmissionStatus.GRADED,
];

export class SubmissionService {
  /**
   * Bat dau lam bai trac nghiem. Han nop duoc chot o server ngay tai day nen
   * client khong the keo dai thoi gian lam bai.
   */
  static async start(assignmentId: string, actor: Actor) {
    const assignment = await AssignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw notFound("Khong tim thay bai tap");
    }

    await assertClassAccess(assignment.session.classId, actor);

    if (assignment.type !== AssignmentType.QUIZ) {
      throw badRequest("Bai thuc hanh khong can bat dau, nop truc tiep");
    }

    const { isOpenNow, isPending } = resolveAssignmentState(assignment);
    if (!isOpenNow) {
      throw badRequest(isPending ? "Bai tap chua den gio mo" : "Bai tap da dong");
    }

    const existing = await prisma.submission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId: actor.userId } },
    });

    if (existing && FINISHED_STATUSES.includes(existing.status)) {
      throw conflict("Ban da nop bai nay roi");
    }

    // Vao lai giua chung thi tiep tuc luot cu, khong reset dong ho.
    if (existing) {
      if (existing.expiresAt && existing.expiresAt <= new Date()) {
        await finalizeSubmission(existing.id, true);
        throw badRequest("Da het gio lam bai");
      }

      return this.buildAttempt(existing.id, assignment.questions);
    }

    const startedAt = new Date();
    const created = await SubmissionRepository.create({
      assignmentId,
      userId: actor.userId,
      status: SubmissionStatus.IN_PROGRESS,
      startedAt,
      expiresAt: resolveExpiresAt(assignment, startedAt),
      answers: {},
    });

    return this.buildAttempt(created.id, assignment.questions);
  }

  /** Auto-save: client goi dinh ky trong luc lam bai. */
  static async saveAnswers(submissionId: string, data: SaveAnswersInput, actor: Actor) {
    const submission = await this.assertOwnedSubmission(submissionId, actor);

    if (submission.status !== SubmissionStatus.IN_PROGRESS) {
      throw badRequest("Bai lam da duoc nop");
    }

    if (submission.expiresAt && submission.expiresAt <= new Date()) {
      await finalizeSubmission(submissionId, true);
      throw badRequest("Da het gio lam bai");
    }

    const questionIds = new Set(
      (await AssignmentRepository.findQuestions(submission.assignmentId)).map((item) => item.id),
    );

    const answers = Object.entries(data.answers).reduce<Record<string, number>>(
      (acc, [questionId, selected]) => {
        if (questionIds.has(questionId)) {
          acc[questionId] = selected;
        }

        return acc;
      },
      {},
    );

    const updated = await SubmissionRepository.update(submissionId, { answers });

    return {
      id: updated.id,
      answers: updated.answers,
      expiresAt: updated.expiresAt,
      serverTime: new Date(),
    };
  }

  /**
   * Nop bai trac nghiem. Neu request den sau han thi van nhan nhung danh dau
   * AUTO_SUBMITTED - dung voi truong hop timer client cham vai giay.
   */
  static async submitQuiz(submissionId: string, answers: Record<string, number> | undefined, actor: Actor) {
    const submission = await this.assertOwnedSubmission(submissionId, actor);

    if (submission.status !== SubmissionStatus.IN_PROGRESS) {
      throw badRequest("Bai lam da duoc nop");
    }

    const isExpired = Boolean(submission.expiresAt && submission.expiresAt <= new Date());

    if (answers && !isExpired) {
      await this.saveAnswers(submissionId, { answers }, actor);
    }

    const finalized = await finalizeSubmission(submissionId, isExpired);
    if (!finalized) {
      throw notFound("Khong tim thay bai lam");
    }

    return this.getResult(finalized.id, actor);
  }

  /** Nop bai thuc hanh: file da upload hoac link GitHub/Drive. */
  static async submitPractical(assignmentId: string, data: SubmitPracticalInput, actor: Actor) {
    const assignment = await AssignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw notFound("Khong tim thay bai tap");
    }

    await assertClassAccess(assignment.session.classId, actor);

    if (assignment.type !== AssignmentType.PRACTICAL) {
      throw badRequest("Bai trac nghiem phai lam qua man hinh lam bai");
    }

    const { isOpenNow, isPending } = resolveAssignmentState(assignment);
    if (!isOpenNow) {
      throw badRequest(isPending ? "Bai tap chua den gio mo" : "Da qua han nop bai");
    }

    const now = new Date();
    const payload = {
      status: SubmissionStatus.SUBMITTED,
      submittedAt: now,
      fileUrl: data.fileUrl || null,
      submitLink: data.submitLink || null,
    };

    const existing = await prisma.submission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId: actor.userId } },
    });

    // Nop lai truoc han thi ghi de bai cu va bo diem da cham (neu co).
    if (existing) {
      return SubmissionRepository.update(existing.id, {
        ...payload,
        score: null,
        feedback: null,
        gradedById: null,
        gradedAt: null,
      });
    }

    return SubmissionRepository.create({
      assignmentId,
      userId: actor.userId,
      startedAt: now,
      ...payload,
    });
  }

  static async getMySubmission(assignmentId: string, actor: Actor) {
    const submission = await SubmissionRepository.findByAssignmentAndUser(
      assignmentId,
      actor.userId,
    );

    if (!submission) {
      return null;
    }

    return { ...submission, serverTime: new Date() };
  }

  static async listMine(actor: Actor) {
    return SubmissionRepository.findManyForStudent(actor.userId);
  }

  /** Ket qua sau khi nop: sinh vien thay dung/sai tung cau. */
  static async getResult(submissionId: string, actor: Actor) {
    const submission = await SubmissionRepository.findById(submissionId);
    if (!submission) {
      throw notFound("Khong tim thay bai lam");
    }

    const { isManager } = await assertClassAccess(submission.assignment.session.classId, actor);
    if (!isManager && submission.userId !== actor.userId) {
      throw forbidden("Ban khong xem duoc bai lam nay");
    }

    if (submission.assignment.type !== AssignmentType.QUIZ) {
      return { ...submission, serverTime: new Date() };
    }

    const isFinished = FINISHED_STATUSES.includes(submission.status);
    if (!isFinished && !isManager) {
      return { ...submission, details: null, serverTime: new Date() };
    }

    const questions = await AssignmentRepository.findQuestions(submission.assignmentId);
    const answers = parseAnswers(submission.answers);
    const grade = gradeQuiz(questions, answers, submission.assignment.maxScore);
    // Danh so lai theo dung thu tu sinh vien da thay luc lam bai.
    const shuffled = seededShuffle(questions, submission.id);

    return {
      ...submission,
      serverTime: new Date(),
      details: shuffled.map((question) => ({
        id: question.id,
        question: question.question,
        options: question.options,
        order: question.order,
        correctAnswer: question.correctAnswer,
        selectedAnswer: answers[question.id] ?? null,
        isCorrect: answers[question.id] === question.correctAnswer,
      })),
      correctCount: grade.correctCount,
      totalQuestions: grade.totalQuestions,
    };
  }

  /** Giang vien cham tay (bai thuc hanh, hoac sua diem bai trac nghiem). */
  static async grade(submissionId: string, data: GradeSubmissionInput, actor: Actor) {
    const submission = await SubmissionRepository.findById(submissionId);
    if (!submission) {
      throw notFound("Khong tim thay bai lam");
    }

    const { isManager } = await assertClassAccess(submission.assignment.session.classId, actor);
    if (!isManager) {
      throw forbidden("Chi giang vien phu trach moi cham duoc bai");
    }

    if (!submission.submittedAt) {
      throw badRequest("Sinh vien chua nop bai");
    }

    if (data.score > submission.assignment.maxScore) {
      throw badRequest(`Diem khong duoc vuot qua ${submission.assignment.maxScore}`);
    }

    return SubmissionRepository.update(submissionId, {
      score: data.score,
      feedback: data.feedback ?? null,
      status: SubmissionStatus.GRADED,
      gradedById: actor.userId,
      gradedAt: new Date(),
    });
  }

  static async listPendingGrading(actor: Actor) {
    return SubmissionRepository.findPendingGrading(
      actor.role === UserRole.ADMIN ? null : actor.userId,
    );
  }

  private static async assertOwnedSubmission(submissionId: string, actor: Actor) {
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      throw notFound("Khong tim thay bai lam");
    }

    if (submission.userId !== actor.userId) {
      throw forbidden("Ban khong lam bai nay");
    }

    return submission;
  }

  private static async buildAttempt(
    submissionId: string,
    questions: { id: string; question: string; options: unknown; order: number }[],
  ) {
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });

    return {
      submission,
      serverTime: new Date(),
      // Moi sinh vien mot thu tu cau hoi khac nhau, on dinh qua cac lan tai lai.
      questions: seededShuffle(questions, submissionId).map(({ id, question, options, order }) => ({
        id,
        question,
        options,
        order,
      })),
    };
  }
}
