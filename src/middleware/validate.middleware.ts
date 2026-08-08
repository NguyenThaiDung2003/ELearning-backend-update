import { NextFunction, Request, Response } from "express";
import { ZodTypeAny, ZodError } from "zod";

import { sendError } from "../utils/response";

export const validateMiddleware =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(
          res,
          error.issues.map((issue) => issue.message).join(", "),
          400,
        );
      }

      return sendError(res, "Validation failed", 400);
    }
  };