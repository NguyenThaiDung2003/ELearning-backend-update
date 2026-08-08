import { Router } from "express";

import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import courseRoutes from "./course.routes";
import enrollmentRoutes from "./enrollment.routes";
import lessonRoutes from "./lesson.routes";
import paymentRoutes from "./payment.routes";
import progressRoutes from "./progress.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is ready",
  });
});

router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/lessons", lessonRoutes);
router.use("/payments", paymentRoutes);
router.use("/progress", progressRoutes);
router.use("/upload", uploadRoutes);

export default router;
