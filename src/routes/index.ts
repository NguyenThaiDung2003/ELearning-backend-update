import { Router } from "express";

import adminRoutes from "./admin.routes";
import assignmentRoutes from "./assignment.routes";
import authRoutes from "./auth.routes";
import classRoutes from "./class.routes";
import questionRoutes from "./question.routes";
import sessionRoutes from "./session.routes";
import submissionRoutes from "./submission.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is ready",
  });
});

router.use("/admin", adminRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/auth", authRoutes);
router.use("/classes", classRoutes);
router.use("/questions", questionRoutes);
router.use("/sessions", sessionRoutes);
router.use("/submissions", submissionRoutes);
router.use("/upload", uploadRoutes);

export default router;
