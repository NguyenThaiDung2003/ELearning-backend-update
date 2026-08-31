import { AssignmentStatus } from "@prisma/client";

import { SessionRepository } from "../repositories/session.repository";
import { notFound } from "../utils/errors";
import { resolveAssignmentState } from "../utils/assignment";
import { Actor, assertClassAccess, assertClassManager } from "./access.service";
import { CreateSessionInput, UpdateSessionInput } from "../validators/session.validator";

type RawAssignment = {
  status: AssignmentStatus;
  openAt: Date | null;
  closeAt: Date | null;
  durationMinutes: number | null;
};

/** Sinh vien khong duoc thay bai o trang thai nhap. */
const visibleAssignments = <T extends RawAssignment>(assignments: T[], isManager: boolean) =>
  assignments
    .map((assignment) => ({ ...assignment, ...resolveAssignmentState(assignment) }))
    .filter((assignment) => isManager || assignment.status !== AssignmentStatus.DRAFT);

export class SessionService {
  static async listByClass(classId: string, actor: Actor) {
    const { isManager } = await assertClassAccess(classId, actor);
    const sessions = await SessionRepository.findManyByClass(classId);

    return sessions.map((session) => ({
      ...session,
      assignments: visibleAssignments(session.assignments, isManager),
    }));
  }

  static async getById(id: string, actor: Actor) {
    const session = await SessionRepository.findById(id);
    if (!session) {
      throw notFound("Khong tim thay buoi hoc");
    }

    const { isManager } = await assertClassAccess(session.classId, actor);

    return {
      ...session,
      assignments: visibleAssignments(session.assignments, isManager),
      isManager,
    };
  }

  static async create(classId: string, data: CreateSessionInput, actor: Actor) {
    await assertClassManager(classId, actor);

    return SessionRepository.create({
      classId,
      title: data.title,
      sessionDate: data.sessionDate,
      recordLink: data.recordLink || null,
    });
  }

  static async update(id: string, data: UpdateSessionInput, actor: Actor) {
    const session = await SessionRepository.findBasicById(id);
    if (!session) {
      throw notFound("Khong tim thay buoi hoc");
    }

    await assertClassManager(session.classId, actor);

    return SessionRepository.update(id, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.sessionDate !== undefined ? { sessionDate: data.sessionDate } : {}),
      ...(data.recordLink !== undefined ? { recordLink: data.recordLink || null } : {}),
    });
  }

  static async remove(id: string, actor: Actor) {
    const session = await SessionRepository.findBasicById(id);
    if (!session) {
      throw notFound("Khong tim thay buoi hoc");
    }

    await assertClassManager(session.classId, actor);
    await SessionRepository.delete(id);
  }
}
