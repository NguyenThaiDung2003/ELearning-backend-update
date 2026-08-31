import { Router } from "express";
import multer from "multer";

import { UploadController } from "../controllers/upload.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireTeacher } from "../middleware/role.middleware";

const SUBMISSION_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Chi chap nhan file anh"));
      return;
    }

    callback(null, true);
  },
});

const submissionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const isAllowed =
      file.mimetype.startsWith("image/") || SUBMISSION_MIME_TYPES.includes(file.mimetype);

    if (!isAllowed) {
      callback(new Error("Chi chap nhan anh, pdf, zip, doc, ppt hoac txt"));
      return;
    }

    callback(null, true);
  },
});

const router = Router();

router.use(authMiddleware);

router.post("/image", requireTeacher, imageUpload.single("image"), UploadController.uploadImage);
router.post("/submission", submissionUpload.single("file"), UploadController.uploadSubmission);

export default router;
