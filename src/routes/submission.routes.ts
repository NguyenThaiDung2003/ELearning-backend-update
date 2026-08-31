import { Router } from "express";

import { SubmissionController } from "../controllers/submission.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireTeacher } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/me", SubmissionController.listMine);
router.get("/pending-grading", requireTeacher, SubmissionController.listPendingGrading);

router.get("/:id", SubmissionController.getById);
router.patch("/:id/answers", SubmissionController.saveAnswers);
router.post("/:id/submit", SubmissionController.submit);
router.patch("/:id/grade", requireTeacher, SubmissionController.grade);

export default router;
