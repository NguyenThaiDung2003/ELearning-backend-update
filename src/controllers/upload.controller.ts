import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { cloudinary } from "../utils/cloudinary";
import { sendError, sendSuccess } from "../utils/response";

const uploadBufferToCloudinary = (buffer: Buffer) =>
  new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "elearning",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });

export class UploadController {
  static async uploadImage(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, "Vui long chon file anh", 400);
      }

      const url = await uploadBufferToCloudinary(req.file.buffer);
      return sendSuccess(res, { url }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      return sendError(res, message, 500);
    }
  }
}
