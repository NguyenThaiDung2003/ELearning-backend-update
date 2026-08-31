import { Prisma, UserRole } from "@prisma/client";
import { Response } from "express";

import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/async-handler";
import { getParam } from "../utils/params";
import { badRequest, conflict, notFound } from "../utils/errors";
import { hashValue } from "../utils/hash";
import { sendSuccess } from "../utils/response";
import {
  adminUserListQuerySchema,
  createUserSchema,
  updateUserRoleSchema,
} from "../validators/admin.validator";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const buildUserWhere = (
  role: "ALL" | UserRole,
  search?: string,
): Prisma.UserWhereInput => ({
  ...(role !== "ALL" ? { role } : {}),
  ...(search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {}),
});

export class AdminController {
  static getStats = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const [students, instructors, classes, sessions, assignments, submissions] = await Promise.all([
      prisma.user.count({ where: { role: UserRole.STUDENT } }),
      prisma.user.count({ where: { role: UserRole.INSTRUCTOR } }),
      prisma.class.count(),
      prisma.session.count(),
      prisma.assignment.count(),
      prisma.submission.count({ where: { submittedAt: { not: null } } }),
    ]);

    return sendSuccess(res, {
      students,
      instructors,
      classes,
      sessions,
      assignments,
      submissions,
    });
  });

  static getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, search, role } = adminUserListQuerySchema.parse(req.query);
    const where = buildUserWhere(role, search);

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccess(res, {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  static createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw conflict("Email da duoc su dung");
    }

    const user = await prisma.user.create({
      data: { ...body, password: await hashValue(body.password) },
      select: userSelect,
    });

    return sendSuccess(res, user, 201);
  });

  static updateUserRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { role } = updateUserRoleSchema.parse(req.body);
    const userId = getParam(req, "id");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw notFound("Khong tim thay nguoi dung");
    }

    if (user.id === req.user?.userId && role !== UserRole.ADMIN) {
      throw badRequest("Khong the tu ha quyen admin cua chinh minh");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: userSelect,
    });

    return sendSuccess(res, updated);
  });

  static getClasses = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const classes = await prisma.class.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, sessions: true } },
      },
    });

    return sendSuccess(res, classes);
  });
}
