import { NextFunction, Request, RequestHandler, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";

type Handler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async controller so rejected promises reach errorMiddleware
 * instead of hanging the request.
 */
export const asyncHandler = (handler: Handler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req as AuthenticatedRequest, res, next)).catch(next);
  };
