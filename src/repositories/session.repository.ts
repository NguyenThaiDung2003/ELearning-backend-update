import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";

const assignmentSelect = {
  id: true,
  title: true,
  type: true,
  status: true,
  openAt: true,
  closeAt: true,
  durationMinutes: true,
  maxScore: true,
} satisfies Prisma.AssignmentSelect;

export class SessionRepository {
  static async findManyByClass(classId: string) {
    return prisma.session.findMany({
      where: { classId },
      orderBy: { sessionDate: "asc" },
      include: {
        assignments: { select: assignmentSelect, orderBy: { createdAt: "asc" } },
      },
    });
  }

  static async findById(id: string) {
    return prisma.session.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, title: true, instructorId: true } },
        assignments: { select: assignmentSelect, orderBy: { createdAt: "asc" } },
      },
    });
  }

  static async findBasicById(id: string) {
    return prisma.session.findUnique({ where: { id } });
  }

  static async create(data: Prisma.SessionUncheckedCreateInput) {
    return prisma.session.create({ data });
  }

  static async update(id: string, data: Prisma.SessionUpdateInput) {
    return prisma.session.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.session.delete({ where: { id } });
  }
}
