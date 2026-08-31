import { Router } from "express";

import { AdminController } from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get("/stats", AdminController.getStats);
router.get("/classes", AdminController.getClasses);
router.get("/users", AdminController.getUsers);
router.post("/users", AdminController.createUser);
router.put("/users/:id/role", AdminController.updateUserRole);

export default router;
