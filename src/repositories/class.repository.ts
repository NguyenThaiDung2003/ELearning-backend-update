import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";

const instructorSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} satisfies Prisma.UserSelect;

export class ClassRepository {
  static async findManyForInstructor(instructorId: string) {
    return prisma.class.findMany({
      where: { instructorId },
      orderBy: { createdAt: "desc" },
      include: {
        instructor: { select: instructorSelect },
        _count: { select: { members: true, sessions: true } },
      },
    });
  }

  static async findManyForStudent(userId: string) {
    return prisma.class.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      include: {
        instructor: { select: instructorSelect },
        _count: { select: { members: true, sessions: true } },
      },
    });
  }

  static async findAll() {
    return prisma.class.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        instructor: { select: instructorSelect },
        _count: { select: { members: true, sessions: true } },
      },
    });
  }

  static async findById(id: string) {
    return prisma.class.findUnique({
      where: { id },
      include: {
        instructor: { select: instructorSelect },
        sessions: {
          orderBy: { sessionDate: "asc" },
          include: { _count: { select: { assignments: true } } },
        },
        _count: { select: { members: true } },
      },
    });
  }

  /** Ban rut gon dung cho kiem tra quyen, khong keo theo quan he. */
  static async findBasicById(id: string) {
    return prisma.class.findUnique({ where: { id } });
  }

  static async create(data: Prisma.ClassUncheckedCreateInput) {
    return prisma.class.create({
      data,
      include: { instructor: { select: instructorSelect } },
    });
  }

  static async update(id: string, data: Prisma.ClassUpdateInput) {
    return prisma.class.update({
      where: { id },
      data,
      include: { instructor: { select: instructorSelect } },
    });
  }

  static async delete(id: string) {
    return prisma.class.delete({ where: { id } });
  }

  static async findMembers(classId: string) {
    return prisma.classMember.findMany({
      where: { classId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: instructorSelect } },
    });
  }

  static async findMember(classId: string, userId: string) {
    return prisma.classMember.findUnique({
      where: { userId_classId: { userId, classId } },
    });
  }

  static async addMember(classId: string, userId: string) {
    return prisma.classMember.create({
      data: { classId, userId },
      include: { user: { select: instructorSelect } },
    });
  }

  static async removeMember(classId: string, userId: string) {
    return prisma.classMember.delete({
      where: { userId_classId: { userId, classId } },
    });
  }
}
