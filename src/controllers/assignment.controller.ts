import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AssignmentService } from "../services/assignment.service";
import { SubmissionService } from "../services/submission.service";
import { asyncHandler } from "../utils/async-handler";
import { getActor } from "../utils/actor";
import { getParam } from "../utils/params";
import { sendSuccess } from "../utils/response";
import {
  createAssignmentSchema,
  questionSchema,
  replaceQuestionsSchema,
  updateAssignmentSchema,
} from "../validators/assignment.validator";
import { submitPracticalSchema } from "../validators/submission.validator";

export class AssignmentController {
  static listBySession = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await AssignmentService.listBySession(getParam(req, "id"), getActor(req))),
  );

  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = createAssignmentSchema.parse(req.body);
    return sendSuccess(res, await AssignmentService.create(getParam(req, "id"), body, getActor(req)), 201);
  });

  static listOpen = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await AssignmentService.listOpenForStudent(getActor(req))),
  );

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await AssignmentService.getById(getParam(req, "id"), getActor(req))),
  );

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = updateAssignmentSchema.parse(req.body);
    return sendSuccess(res, await AssignmentService.update(getParam(req, "id"), body, getActor(req)));
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await AssignmentService.remove(getParam(req, "id"), getActor(req));
    return sendSuccess(res, { message: "Da xoa bai tap" });
  });

  static open = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await AssignmentService.open(getParam(req, "id"), getActor(req))),
  );

  static close = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await AssignmentService.close(getParam(req, "id"), getActor(req))),
  );

  static listQuestions = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await AssignmentService.listQuestions(getParam(req, "id"), getActor(req))),
  );

  static addQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = questionSchema.parse(req.body);
    return sendSuccess(res, await AssignmentService.addQuestion(getParam(req, "id"), body, getActor(req)), 201);
  });

  static replaceQuestions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = replaceQuestionsSchema.parse(req.body);
    return sendSuccess(
      res,
      await AssignmentService.replaceQuestions(getParam(req, "id"), body.questions, getActor(req)),
    );
  });

  static updateQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = questionSchema.parse(req.body);
    return sendSuccess(res, await AssignmentService.updateQuestion(getParam(req, "id"), body, getActor(req)));
  });

  static removeQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await AssignmentService.removeQuestion(getParam(req, "id"), getActor(req));
    return sendSuccess(res, { message: "Da xoa cau hoi" });
  });

  static listSubmissions = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await AssignmentService.listSubmissions(getParam(req, "id"), getActor(req))),
  );

  static exportSubmissions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { filename, content } = await AssignmentService.exportSubmissionsCsv(
      getParam(req, "id"),
      getActor(req),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(content);
  });

  static start = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await SubmissionService.start(getParam(req, "id"), getActor(req)), 201),
  );

  static submitPractical = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = submitPracticalSchema.parse(req.body);
    return sendSuccess(
      res,
      await SubmissionService.submitPractical(getParam(req, "id"), body, getActor(req)),
      201,
    );
  });

  static getMySubmission = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await SubmissionService.getMySubmission(getParam(req, "id"), getActor(req))),
  );
}
