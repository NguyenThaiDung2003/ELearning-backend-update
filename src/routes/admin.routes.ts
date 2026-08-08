import { Router } from "express";

import { AdminController } from "../controllers/admin.controller";
import { adminAuthMiddleware } from "../middleware/admin-auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/stats", AdminController.getStats);

router.get("/courses", AdminController.getCourses);
router.post("/courses", AdminController.createCourse);
router.put("/courses/:id/publish", AdminController.publishCourse);
router.put("/courses/:id/unpublish", AdminController.unpublishCourse);
router.put("/courses/:id", AdminController.updateCourse);
router.delete("/courses/:id", AdminController.deleteCourse);

router.post("/courses/:courseId/chapters", AdminController.createChapter);
router.put("/chapters/:id", AdminController.updateChapter);
router.delete("/chapters/:id", AdminController.deleteChapter);

router.post("/chapters/:chapterId/lessons", AdminController.createLesson);
router.put("/lessons/:id", AdminController.updateLesson);
router.delete("/lessons/:id", AdminController.deleteLesson);

router.get("/enrollments", AdminController.getEnrollments);
router.put("/enrollments/:id/confirm", AdminController.confirmEnrollment);
router.put("/enrollments/:id/cancel", AdminController.cancelEnrollment);

router.get("/users", AdminController.getUsers);
router.put("/users/:id/role", AdminController.updateUserRole);

export default router;
