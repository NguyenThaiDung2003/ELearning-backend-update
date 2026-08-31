import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { SessionService } from "../services/session.service";
import { asyncHandler } from "../utils/async-handler";
import { getActor } from "../utils/actor";
import { getParam } from "../utils/params";
import { sendSuccess } from "../utils/response";
import { createSessionSchema, updateSessionSchema } from "../validators/session.validator";

export class SessionController {
  static listByClass = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await SessionService.listByClass(getParam(req, "id"), getActor(req))),
  );

  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = createSessionSchema.parse(req.body);
    return sendSuccess(res, await SessionService.create(getParam(req, "id"), body, getActor(req)), 201);
  });

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await SessionService.getById(getParam(req, "id"), getActor(req))),
  );

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = updateSessionSchema.parse(req.body);
    return sendSuccess(res, await SessionService.update(getParam(req, "id"), body, getActor(req)));
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await SessionService.remove(getParam(req, "id"), getActor(req));
    return sendSuccess(res, { message: "Da xoa buoi hoc" });
  });
}
