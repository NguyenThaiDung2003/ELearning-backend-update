import { Router } from "express";

import { AssignmentController } from "../controllers/assignment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireTeacher } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware, requireTeacher);

router.put("/:id", AssignmentController.updateQuestion);
router.delete("/:id", AssignmentController.removeQuestion);

export default router;
