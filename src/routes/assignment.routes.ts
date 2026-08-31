import { Router } from "express";

import { AssignmentController } from "../controllers/assignment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireTeacher } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware);

// Sinh vien: danh sach bai dang mo trong cac lop minh tham gia.
router.get("/open", AssignmentController.listOpen);

router.get("/:id", AssignmentController.getById);
router.put("/:id", requireTeacher, AssignmentController.update);
router.delete("/:id", requireTeacher, AssignmentController.remove);

router.post("/:id/open", requireTeacher, AssignmentController.open);
router.post("/:id/close", requireTeacher, AssignmentController.close);

router.get("/:id/questions", requireTeacher, AssignmentController.listQuestions);
router.post("/:id/questions", requireTeacher, AssignmentController.addQuestion);
router.put("/:id/questions", requireTeacher, AssignmentController.replaceQuestions);

router.get("/:id/submissions", requireTeacher, AssignmentController.listSubmissions);
router.get("/:id/submissions/export", requireTeacher, AssignmentController.exportSubmissions);

router.post("/:id/start", AssignmentController.start);
router.post("/:id/submit-practical", AssignmentController.submitPractical);
router.get("/:id/my-submission", AssignmentController.getMySubmission);

export default router;
