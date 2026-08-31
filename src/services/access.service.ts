import { UserRole } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { forbidden, notFound } from "../utils/errors";

export interface Actor {
  userId: string;
  role: UserRole;
}

/** Giang vien so huu lop (hoac admin) moi duoc chinh sua lop. */
export const assertClassManager = async (classId: string, actor: Actor) => {
  const classRoom = await prisma.class.findUnique({ where: { id: classId } });
  if (!classRoom) {
    throw notFound("Khong tim thay lop hoc");
  }

  if (actor.role !== UserRole.ADMIN && classRoom.instructorId !== actor.userId) {
    throw forbidden("Ban khong quan ly lop hoc nay");
  }

  return classRoom;
};

/** Giang vien so huu, admin, hoac sinh vien da tham gia lop. */
export const assertClassAccess = async (classId: string, actor: Actor) => {
  const classRoom = await prisma.class.findUnique({ where: { id: classId } });
  if (!classRoom) {
    throw notFound("Khong tim thay lop hoc");
  }

  if (actor.role === UserRole.ADMIN || classRoom.instructorId === actor.userId) {
    return { classRoom, isManager: true };
  }

  const membership = await prisma.classMember.findUnique({
    where: { userId_classId: { userId: actor.userId, classId } },
  });

  if (!membership) {
    throw forbidden("Ban khong thuoc lop hoc nay");
  }

  return { classRoom, isManager: false };
};

export const isClassManager = (instructorId: string, actor: Actor) =>
  actor.role === UserRole.ADMIN || instructorId === actor.userId;
