import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";

export const questionOrder: Prisma.QuestionOrderByWithRelationInput = { order: "asc" };

export class AssignmentRepository {
  static async findManyBySession(sessionId: string) {
    return prisma.assignment.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { questions: true, submissions: true } } },
    });
  }

  static async findById(id: string) {
    return prisma.assignment.findUnique({
      where: { id },
      include: {
        questions: { orderBy: questionOrder },
        session: {
          select: {
            id: true,
            title: true,
            sessionDate: true,
            classId: true,
            class: { select: { id: true, title: true, instructorId: true } },
          },
        },
        _count: { select: { submissions: true } },
      },
    });
  }

  static async findBasicById(id: string) {
    return prisma.assignment.findUnique({
      where: { id },
      include: { session: { select: { classId: true } } },
    });
  }

  /** Bai tap dang mo trong cac lop ma sinh vien tham gia. */
  static async findOpenForStudent(userId: string) {
    return prisma.assignment.findMany({
      where: {
        status: "OPEN",
        session: { class: { members: { some: { userId } } } },
      },
      orderBy: [{ closeAt: "asc" }, { createdAt: "desc" }],
      include: {
        session: {
          select: {
            id: true,
            title: true,
            sessionDate: true,
            class: { select: { id: true, title: true } },
          },
        },
        submissions: { where: { userId } },
        _count: { select: { questions: true } },
      },
    });
  }

  static async create(data: Prisma.AssignmentUncheckedCreateInput) {
    return prisma.assignment.create({ data });
  }

  static async update(id: string, data: Prisma.AssignmentUpdateInput) {
    return prisma.assignment.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.assignment.delete({ where: { id } });
  }

  static async countQuestions(assignmentId: string) {
    return prisma.question.count({ where: { assignmentId } });
  }

  static async findQuestions(assignmentId: string) {
    return prisma.question.findMany({ where: { assignmentId }, orderBy: questionOrder });
  }

  static async findQuestionById(id: string) {
    return prisma.question.findUnique({ where: { id } });
  }

  static async createQuestion(data: Prisma.QuestionUncheckedCreateInput) {
    return prisma.question.create({ data });
  }

  static async updateQuestion(id: string, data: Prisma.QuestionUncheckedUpdateInput) {
    return prisma.question.update({ where: { id }, data });
  }

  static async deleteQuestion(id: string) {
    return prisma.question.delete({ where: { id } });
  }

  static async replaceQuestions(
    assignmentId: string,
    questions: Prisma.QuestionCreateManyInput[],
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { assignmentId } });
      await tx.question.createMany({ data: questions });

      return tx.question.findMany({ where: { assignmentId }, orderBy: questionOrder });
    });
  }

  static async findSubmissions(assignmentId: string) {
    return prisma.submission.findMany({
      where: { assignmentId },
      orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
      include: {
        user: { select: { id: true, name: true, email: true } },
        gradedBy: { select: { id: true, name: true } },
      },
    });
  }
}
