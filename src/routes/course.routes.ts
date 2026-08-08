import { Router } from "express";

import { CourseController } from "../controllers/course.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminRoleMiddleware } from "../middleware/admin-role.middleware";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";

const router = Router();

router.get("/", CourseController.getCourses);
router.get("/:slug", optionalAuthMiddleware, CourseController.getCourseBySlug);
router.post("/", authMiddleware, adminRoleMiddleware, CourseController.createCourse);
router.put("/:id", authMiddleware, adminRoleMiddleware, CourseController.updateCourse);
router.delete("/:id", authMiddleware, adminRoleMiddleware, CourseController.deleteCourse);

export default router;