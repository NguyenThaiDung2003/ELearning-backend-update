import { AssignmentStatus, AssignmentType, Prisma, SubmissionStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { AssignmentRepository } from "../repositories/assignment.repository";
import { ClassRepository } from "../repositories/class.repository";
import { SessionRepository } from "../repositories/session.repository";
import { badRequest, forbidden, notFound } from "../utils/errors";
import { resolveAssignmentState } from "../utils/assignment";
import { toCsv, withBom } from "../utils/csv";
import { Actor, assertClassAccess, assertClassManager } from "./access.service";
import { autoSubmitExpired, finalizeSubmission } from "./grading.service";
import {
  CreateAssignmentInput,
  QuestionInput,
  UpdateAssignmentInput,
} from "../validators/assignment.validator";

interface RawQuestion {
  id: string;
  question: string;
  options: Prisma.JsonValue;
  order: number;
  correctAnswer: number;
}

/** Sinh vien khong bao gio nhan duoc correctAnswer khi dang lam bai. */
const sanitizeQuestion = ({ correctAnswer, ...question }: RawQuestion) => question;

const toQuestionRows = (assignmentId: string, questions: QuestionInput[]) =>
  questions.map((question, index) => ({
    assignmentId,
    question: question.question,
    options: question.options,
    correctAnswer: question.correctAnswer,
    order: question.order ?? index + 1,
  }));

export class AssignmentService {
  static async listBySession(sessionId: string, actor: Actor) {
    const session = await SessionRepository.findBasicById(sessionId);
    if (!session) {
      throw notFound("Khong tim thay buoi hoc");
    }

    const { isManager } = await assertClassAccess(session.classId, actor);
    const assignments = await AssignmentRepository.findManyBySession(sessionId);

    return assignments
      .filter((assignment) => isManager || assignment.status !== AssignmentStatus.DRAFT)
      .map((assignment) => ({ ...assignment, ...resolveAssignmentState(assignment) }));
  }

  static async getById(id: string, actor: Actor) {
    const assignment = await AssignmentRepository.findById(id);
    if (!assignment) {
      throw notFound("Khong tim thay bai tap");
    }

    const { isManager } = await assertClassAccess(assignment.session.classId, actor);

    if (!isManager && assignment.status === AssignmentStatus.DRAFT) {
      throw forbidden("Bai tap chua duoc mo");
    }

    const state = resolveAssignmentState(assignment);

    if (isManager) {
      return { ...assignment, ...state, isManager: true };
    }

    const mySubmission = await prisma.submission.findUnique({
      where: { assignmentId_userId: { assignmentId: id, userId: actor.userId } },
    });

    return {
      ...assignment,
      ...state,
      isManager: false,
      // Cau hoi chi lo ra khi sinh vien da bat dau lam va chua nop.
      questions:
        mySubmission?.status === SubmissionStatus.IN_PROGRESS
          ? assignment.questions.map(sanitizeQuestion)
          : [],
      mySubmission,
    };
  }

  static async create(sessionId: string, data: CreateAssignmentInput, actor: Actor) {
    const session = await SessionRepository.findBasicById(sessionId);
    if (!session) {
      throw notFound("Khong tim thay buoi hoc");
    }

    await assertClassManager(session.classId, actor);

    if (data.type === AssignmentType.PRACTICAL && data.questions?.length) {
      throw badRequest("Bai thuc hanh khong co cau hoi trac nghiem");
    }

    const assignment = await AssignmentRepository.create({
      sessionId,
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      durationMinutes: data.durationMinutes ?? null,
      openAt: data.openAt ?? null,
      closeAt: data.closeAt ?? null,
      maxScore: data.maxScore,
      status: data.status ?? AssignmentStatus.DRAFT,
    });

    if (data.questions?.length) {
      await prisma.question.createMany({ data: toQuestionRows(assignment.id, data.questions) });
    }

    return AssignmentRepository.findById(assignment.id);
  }

  static async update(id: string, data: UpdateAssignmentInput, actor: Actor) {
    const assignment = await this.assertManagedAssignment(id, actor);

    // Doi loai bai sau khi da co bai nop se lam sai logic cham diem.
    if (data.type && data.type !== assignment.type) {
      const submissionCount = await prisma.submission.count({ where: { assignmentId: id } });
      if (submissionCount > 0) {
        throw badRequest("Khong the doi loai bai tap khi da co bai nop");
      }
    }

    const openAt = data.openAt !== undefined ? data.openAt : assignment.openAt;
    const closeAt = data.closeAt !== undefined ? data.closeAt : assignment.closeAt;

    if (openAt && closeAt && closeAt <= openAt) {
      throw badRequest("Thoi diem dong bai phai sau thoi diem mo bai");
    }

    await AssignmentRepository.update(id, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.durationMinutes !== undefined
        ? { durationMinutes: data.durationMinutes ?? null }
        : {}),
      ...(data.openAt !== undefined ? { openAt: data.openAt ?? null } : {}),
      ...(data.closeAt !== undefined ? { closeAt: data.closeAt ?? null } : {}),
      ...(data.maxScore !== undefined ? { maxScore: data.maxScore } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    });

    return AssignmentRepository.findById(id);
  }

  static async remove(id: string, actor: Actor) {
    await this.assertManagedAssignment(id, actor);
    await AssignmentRepository.delete(id);
  }

  /** Mo bai: sinh vien trong lop bat dau nhin thay va lam duoc. */
  static async open(id: string, actor: Actor) {
    const assignment = await this.assertManagedAssignment(id, actor);

    if (assignment.type === AssignmentType.QUIZ) {
      const questionCount = await AssignmentRepository.countQuestions(id);
      if (questionCount === 0) {
        throw badRequest("Can it nhat 1 cau hoi truoc khi mo bai");
      }
    }

    const now = new Date();
    const closeAt =
      assignment.closeAt ??
      (assignment.durationMinutes
        ? new Date(now.getTime() + assignment.durationMinutes * 60 * 1000)
        : null);

    await AssignmentRepository.update(id, {
      status: AssignmentStatus.OPEN,
      openAt: assignment.openAt ?? now,
      closeAt,
    });

    return AssignmentRepository.findById(id);
  }

  /** Dong bai: chot va cham tat ca luot lam bai con dang do. */
  static async close(id: string, actor: Actor) {
    await this.assertManagedAssignment(id, actor);

    const pending = await prisma.submission.findMany({
      where: { assignmentId: id, status: SubmissionStatus.IN_PROGRESS },
      select: { id: true },
    });

    for (const submission of pending) {
      await finalizeSubmission(submission.id, true);
    }

    await AssignmentRepository.update(id, {
      status: AssignmentStatus.CLOSED,
      closeAt: new Date(),
    });

    return AssignmentRepository.findById(id);
  }

  static async listOpenForStudent(actor: Actor) {
    const assignments = await AssignmentRepository.findOpenForStudent(actor.userId);

    return assignments
      .map(({ submissions, ...assignment }) => ({
        ...assignment,
        ...resolveAssignmentState(assignment),
        mySubmission: submissions[0] ?? null,
      }))
      .filter((assignment) => assignment.isOpenNow || assignment.isPending);
  }

  static async listQuestions(id: string, actor: Actor) {
    await this.assertManagedAssignment(id, actor);
    return AssignmentRepository.findQuestions(id);
  }

  static async addQuestion(id: string, data: QuestionInput, actor: Actor) {
    const assignment = await this.assertManagedAssignment(id, actor);
    this.assertQuiz(assignment.type);

    const existing = await AssignmentRepository.findQuestions(id);
    const nextOrder = existing.length ? Math.max(...existing.map((item) => item.order)) + 1 : 1;

    return AssignmentRepository.createQuestion({
      assignmentId: id,
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      order: data.order ?? nextOrder,
    });
  }

  static async replaceQuestions(id: string, questions: QuestionInput[], actor: Actor) {
    const assignment = await this.assertManagedAssignment(id, actor);
    this.assertQuiz(assignment.type);

    return AssignmentRepository.replaceQuestions(id, toQuestionRows(id, questions));
  }

  static async updateQuestion(questionId: string, data: QuestionInput, actor: Actor) {
    const question = await AssignmentRepository.findQuestionById(questionId);
    if (!question) {
      throw notFound("Khong tim thay cau hoi");
    }

    await this.assertManagedAssignment(question.assignmentId, actor);

    return AssignmentRepository.updateQuestion(questionId, {
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      ...(data.order !== undefined ? { order: data.order } : {}),
    });
  }

  static async removeQuestion(questionId: string, actor: Actor) {
    const question = await AssignmentRepository.findQuestionById(questionId);
    if (!question) {
      throw notFound("Khong tim thay cau hoi");
    }

    await this.assertManagedAssignment(question.assignmentId, actor);
    await AssignmentRepository.deleteQuestion(questionId);
  }

  /** Bang diem: liet ke ca sinh vien chua nop de giang vien theo doi tien do. */
  static async listSubmissions(id: string, actor: Actor) {
    const assignment = await this.assertManagedAssignment(id, actor);
    await autoSubmitExpired(id);

    const [submissions, members] = await Promise.all([
      AssignmentRepository.findSubmissions(id),
      ClassRepository.findMembers(assignment.session.classId),
    ]);

    const submissionByUser = new Map(submissions.map((item) => [item.userId, item]));

    const rows = members.map((member) => {
      const submission = submissionByUser.get(member.userId);

      return {
        user: member.user,
        status: submission?.status ?? null,
        score: submission?.score ?? null,
        startedAt: submission?.startedAt ?? null,
        submittedAt: submission?.submittedAt ?? null,
        feedback: submission?.feedback ?? null,
        fileUrl: submission?.fileUrl ?? null,
        submitLink: submission?.submitLink ?? null,
        submissionId: submission?.id ?? null,
      };
    });

    const graded = rows.filter((row) => row.score !== null);

    return {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        type: assignment.type,
        maxScore: assignment.maxScore,
        ...resolveAssignmentState(assignment),
      },
      rows,
      summary: {
        totalMembers: rows.length,
        submitted: rows.filter((row) => row.submittedAt !== null).length,
        inProgress: rows.filter((row) => row.status === SubmissionStatus.IN_PROGRESS).length,
        notStarted: rows.filter((row) => row.status === null).length,
        averageScore: graded.length
          ? Math.round(
              (graded.reduce((sum, row) => sum + (row.score ?? 0), 0) / graded.length) * 100,
            ) / 100
          : null,
      },
    };
  }

  static async exportSubmissionsCsv(id: string, actor: Actor) {
    const { assignment, rows } = await this.listSubmissions(id, actor);

    const csv = toCsv(
      ["Ho ten", "Email", "Trang thai", "Diem", "Diem toi da", "Bat dau", "Nop luc", "Nhan xet"],
      rows.map((row) => [
        row.user.name,
        row.user.email,
        row.status ?? "CHUA_LAM",
        row.score ?? "",
        assignment.maxScore,
        row.startedAt?.toISOString() ?? "",
        row.submittedAt?.toISOString() ?? "",
        row.feedback ?? "",
      ]),
    );

    return {
      filename: `bang-diem-${assignment.id}.csv`,
      content: withBom(csv),
    };
  }

  private static assertQuiz(type: AssignmentType) {
    if (type !== AssignmentType.QUIZ) {
      throw badRequest("Chi bai trac nghiem moi co cau hoi");
    }
  }

  private static async assertManagedAssignment(id: string, actor: Actor) {
    const assignment = await AssignmentRepository.findById(id);
    if (!assignment) {
      throw notFound("Khong tim thay bai tap");
    }

    await assertClassManager(assignment.session.classId, actor);

    return assignment;
  }
}
