import { UserRole } from "@prisma/client";
import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "./auth.middleware";
import { sendError } from "../utils/response";

export const adminRoleMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return sendError(res, "Forbidden", 403);
  }

  return next();
};