import { Router } from "express";

import { EnrollmentController } from "../controllers/enrollment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminRoleMiddleware } from "../middleware/admin-role.middleware";

const router = Router();

router.get("/me", authMiddleware, EnrollmentController.getUserEnrollments);
router.get("/my", authMiddleware, EnrollmentController.getUserEnrollments);
router.post("/:courseId", authMiddleware, EnrollmentController.enrollCourse);
router.patch("/:id/confirm", authMiddleware, adminRoleMiddleware, EnrollmentController.confirmEnrollment);

export default router;