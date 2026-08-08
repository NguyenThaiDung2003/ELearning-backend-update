import { Router } from "express";

import { ProgressController } from "../controllers/progress.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, ProgressController.updateProgress);
router.get("/course/:courseId", authMiddleware, ProgressController.getCourseProgress);

export default router;