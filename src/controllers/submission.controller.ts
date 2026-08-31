import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { SubmissionService } from "../services/submission.service";
import { asyncHandler } from "../utils/async-handler";
import { getActor } from "../utils/actor";
import { getParam } from "../utils/params";
import { sendSuccess } from "../utils/response";
import {
  gradeSubmissionSchema,
  saveAnswersSchema,
  submitQuizSchema,
} from "../validators/submission.validator";

export class SubmissionController {
  static listMine = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await SubmissionService.listMine(getActor(req))),
  );

  static listPendingGrading = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await SubmissionService.listPendingGrading(getActor(req))),
  );

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>
    sendSuccess(res, await SubmissionService.getResult(getParam(req, "id"), getActor(req))),
  );

  static saveAnswers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = saveAnswersSchema.parse(req.body);
    return sendSuccess(res, await SubmissionService.saveAnswers(getParam(req, "id"), body, getActor(req)));
  });

  static submit = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = submitQuizSchema.parse(req.body ?? {});
    return sendSuccess(
      res,
      await SubmissionService.submitQuiz(getParam(req, "id"), body.answers, getActor(req)),
    );
  });

  static grade = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = gradeSubmissionSchema.parse(req.body);
    return sendSuccess(res, await SubmissionService.grade(getParam(req, "id"), body, getActor(req)));
  });
}
