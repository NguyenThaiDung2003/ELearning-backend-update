import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";

const assignmentInclude = {
  select: {
    id: true,
    title: true,
    type: true,
    status: true,
    openAt: true,
    closeAt: true,
    durationMinutes: true,
    maxScore: true,
    sessionId: true,
    session: { select: { id: true, title: true, classId: true } },
  },
};

export class SubmissionRepository {
  static async findById(id: string) {
    return prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: assignmentInclude,
        user: { select: { id: true, name: true, email: true } },
        gradedBy: { select: { id: true, name: true } },
      },
    });
  }

  static async findByAssignmentAndUser(assignmentId: string, userId: string) {
    return prisma.submission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId } },
      include: { assignment: assignmentInclude },
    });
  }

  static async create(data: Prisma.SubmissionUncheckedCreateInput) {
    return prisma.submission.create({ data });
  }

  static async update(id: string, data: Prisma.SubmissionUncheckedUpdateInput) {
    return prisma.submission.update({
      where: { id },
      data,
      include: { assignment: assignmentInclude },
    });
  }

  static async findManyForStudent(userId: string) {
    return prisma.submission.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { assignment: assignmentInclude },
    });
  }

  /** Bai cho cham: bai thuc hanh da nop nhung chua co diem. */
  static async findPendingGrading(instructorId: string | null) {
    return prisma.submission.findMany({
      where: {
        score: null,
        submittedAt: { not: null },
        assignment: {
          type: "PRACTICAL",
          ...(instructorId ? { session: { class: { instructorId } } } : {}),
        },
      },
      orderBy: { submittedAt: "asc" },
      include: {
        assignment: assignmentInclude,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
