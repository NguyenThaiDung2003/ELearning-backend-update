import { Router } from "express";

import { ClassController } from "../controllers/class.controller";
import { SessionController } from "../controllers/session.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireTeacher } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", ClassController.list);
router.post("/", requireTeacher, ClassController.create);
router.get("/:id", ClassController.getById);
router.put("/:id", requireTeacher, ClassController.update);
router.delete("/:id", requireTeacher, ClassController.remove);

router.get("/:id/members", ClassController.listMembers);
router.post("/:id/members", requireTeacher, ClassController.addMember);
router.delete("/:id/members/:userId", requireTeacher, ClassController.removeMember);
router.post("/:id/join", ClassController.join);
router.delete("/:id/leave", ClassController.leave);

router.get("/:id/sessions", SessionController.listByClass);
router.post("/:id/sessions", requireTeacher, SessionController.create);

export default router;
