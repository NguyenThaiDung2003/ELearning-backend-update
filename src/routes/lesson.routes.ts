import { Router } from "express";

import { LessonController } from "../controllers/lesson.controller";
import { QuizController } from "../controllers/quiz.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";

const router = Router();

router.get("/:lessonId", optionalAuthMiddleware, LessonController.getLessonDetail);
router.post("/:lessonId/quiz/submit", authMiddleware, QuizController.submitQuiz);

export default router;