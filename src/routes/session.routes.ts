import { Router } from "express";

import { AssignmentController } from "../controllers/assignment.controller";
import { SessionController } from "../controllers/session.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireTeacher } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:id", SessionController.getById);
router.put("/:id", requireTeacher, SessionController.update);
router.delete("/:id", requireTeacher, SessionController.remove);

router.get("/:id/assignments", AssignmentController.listBySession);
router.post("/:id/assignments", requireTeacher, AssignmentController.create);

export default router;
