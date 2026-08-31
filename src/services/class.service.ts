import { UserRole } from "@prisma/client";

import { ClassRepository } from "../repositories/class.repository";
import { prisma } from "../lib/prisma";
import { badRequest, conflict, forbidden, notFound } from "../utils/errors";
import { Actor, assertClassAccess, assertClassManager, isClassManager } from "./access.service";
import { AddMemberInput, CreateClassInput, UpdateClassInput } from "../validators/class.validator";

export class ClassService {
  static async list(actor: Actor) {
    if (actor.role === UserRole.ADMIN) {
      return ClassRepository.findAll();
    }

    if (actor.role === UserRole.INSTRUCTOR) {
      return ClassRepository.findManyForInstructor(actor.userId);
    }

    return ClassRepository.findManyForStudent(actor.userId);
  }

  static async getById(id: string, actor: Actor) {
    const { classRoom } = await assertClassAccess(id, actor);
    const detail = await ClassRepository.findById(classRoom.id);

    if (!detail) {
      throw notFound("Khong tim thay lop hoc");
    }

    return {
      ...detail,
      isManager: isClassManager(detail.instructorId, actor),
    };
  }

  static async create(data: CreateClassInput, actor: Actor) {
    // Chi admin duoc tao lop ho giang vien khac.
    const instructorId =
      data.instructorId && actor.role === UserRole.ADMIN ? data.instructorId : actor.userId;

    const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor) {
      throw notFound("Khong tim thay giang vien");
    }

    if (instructor.role === UserRole.STUDENT) {
      throw badRequest("Nguoi phu trach lop phai la giang vien");
    }

    return ClassRepository.create({
      title: data.title,
      description: data.description ?? null,
      instructorId,
    });
  }

  static async update(id: string, data: UpdateClassInput, actor: Actor) {
    await assertClassManager(id, actor);

    return ClassRepository.update(id, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    });
  }

  static async remove(id: string, actor: Actor) {
    await assertClassManager(id, actor);
    await ClassRepository.delete(id);
  }

  static async listMembers(classId: string, actor: Actor) {
    await assertClassAccess(classId, actor);
    return ClassRepository.findMembers(classId);
  }

  static async addMember(classId: string, data: AddMemberInput, actor: Actor) {
    const classRoom = await assertClassManager(classId, actor);

    const student = data.userId
      ? await prisma.user.findUnique({ where: { id: data.userId } })
      : await prisma.user.findUnique({ where: { email: data.email! } });

    if (!student) {
      throw notFound("Khong tim thay sinh vien");
    }

    if (student.id === classRoom.instructorId) {
      throw badRequest("Giang vien phu trach khong can tham gia lop");
    }

    const existing = await ClassRepository.findMember(classId, student.id);
    if (existing) {
      throw conflict("Sinh vien da o trong lop");
    }

    return ClassRepository.addMember(classId, student.id);
  }

  static async removeMember(classId: string, userId: string, actor: Actor) {
    await assertClassManager(classId, actor);

    const existing = await ClassRepository.findMember(classId, userId);
    if (!existing) {
      throw notFound("Sinh vien khong o trong lop");
    }

    await ClassRepository.removeMember(classId, userId);
  }

  /** Sinh vien tu tham gia lop bang id lop (MVP: khong can duyet). */
  static async join(classId: string, actor: Actor) {
    if (actor.role !== UserRole.STUDENT) {
      throw forbidden("Chi sinh vien moi tham gia lop");
    }

    const classRoom = await ClassRepository.findBasicById(classId);
    if (!classRoom) {
      throw notFound("Khong tim thay lop hoc");
    }

    const existing = await ClassRepository.findMember(classId, actor.userId);
    if (existing) {
      throw conflict("Ban da tham gia lop nay");
    }

    return ClassRepository.addMember(classId, actor.userId);
  }

  static async leave(classId: string, actor: Actor) {
    const existing = await ClassRepository.findMember(classId, actor.userId);
    if (!existing) {
      throw notFound("Ban khong o trong lop nay");
    }

    await ClassRepository.removeMember(classId, actor.userId);
  }
}
