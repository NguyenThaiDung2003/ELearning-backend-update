import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ClassService } from "../services/class.service";
import { asyncHandler } from "../utils/async-handler";
import { getActor } from "../utils/actor";
import { getParam } from "../utils/params";
import { sendSuccess } from "../utils/response";
import {
  addMemberSchema,
  createClassSchema,
  updateClassSchema,
} from "../validators/class.validator";

export class ClassController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await ClassService.list(getActor(req))),
  );

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await ClassService.getById(getParam(req, "id"), getActor(req))),
  );

  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = createClassSchema.parse(req.body);
    return sendSuccess(res, await ClassService.create(body, getActor(req)), 201);
  });

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = updateClassSchema.parse(req.body);
    return sendSuccess(res, await ClassService.update(getParam(req, "id"), body, getActor(req)));
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await ClassService.remove(getParam(req, "id"), getActor(req));
    return sendSuccess(res, { message: "Da xoa lop hoc" });
  });

  static listMembers = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await ClassService.listMembers(getParam(req, "id"), getActor(req))),
  );

  static addMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = addMemberSchema.parse(req.body);
    return sendSuccess(res, await ClassService.addMember(getParam(req, "id"), body, getActor(req)), 201);
  });

  static removeMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await ClassService.removeMember(getParam(req, "id"), getParam(req, "userId"), getActor(req));
    return sendSuccess(res, { message: "Da xoa sinh vien khoi lop" });
  });

  static join = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await ClassService.join(getParam(req, "id"), getActor(req)), 201),
  );

  static leave = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await ClassService.leave(getParam(req, "id"), getActor(req));
    return sendSuccess(res, { message: "Da roi lop hoc" });
  });
}
