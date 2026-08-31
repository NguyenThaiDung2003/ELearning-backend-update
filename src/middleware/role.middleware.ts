import { UserRole } from "@prisma/client";
import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "./auth.middleware";
import { sendError } from "../utils/response";

export const requireRole =
  (...roles: UserRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Unauthorized", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, "Forbidden", 403);
    }

    return next();
  };

/** Giang vien va admin deu quan ly duoc lop hoc. */
export const requireTeacher = requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);

export const requireAdmin = requireRole(UserRole.ADMIN);
