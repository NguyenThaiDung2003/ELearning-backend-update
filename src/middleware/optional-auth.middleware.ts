import { UserRole } from "@prisma/client";
import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

import { AuthenticatedRequest } from "./auth.middleware";
import { sendError } from "../utils/response";
import { verifyJwt } from "../utils/jwt";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret";

interface AccessTokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
}

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyJwt<AccessTokenPayload>(token, ACCESS_TOKEN_SECRET);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch {
    return sendError(res, "Invalid token", 401);
  }
};