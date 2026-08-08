import { Router } from "express";
import multer from "multer";

import { UploadController } from "../controllers/upload.controller";
import { adminAuthMiddleware } from "../middleware/admin-auth.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Chi chap nhan file anh"));
      return;
    }

    callback(null, true);
  },
});

const router = Router();

router.use(adminAuthMiddleware);
router.post("/image", upload.single("image"), UploadController.uploadImage);

export default router;
