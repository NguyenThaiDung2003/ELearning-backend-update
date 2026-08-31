import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/async-handler";
import { badRequest } from "../utils/errors";
import { uploadBuffer } from "../utils/cloudinary";
import { sendSuccess } from "../utils/response";

export class UploadController {
  static uploadImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw badRequest("Vui long chon file anh");
    }

    const uploaded = await uploadBuffer(req.file.buffer, {
      folder: "elearning/images",
      resource_type: "image",
    });

    return sendSuccess(res, uploaded, 201);
  });

  /** File nop bai: pdf, zip, doc... nen dung resource_type "raw"/"auto". */
  static uploadSubmission = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw badRequest("Vui long chon file bai lam");
    }

    const uploaded = await uploadBuffer(req.file.buffer, {
      folder: "elearning/submissions",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      filename_override: req.file.originalname,
    });

    return sendSuccess(res, { ...uploaded, originalName: req.file.originalname }, 201);
  });
}
