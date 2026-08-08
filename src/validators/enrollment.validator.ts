import { z } from "zod";

export const enrollCourseParamsSchema = z.object({
  courseId: z.string().min(1, "Course id is required"),
});

export const confirmEnrollmentParamsSchema = z.object({
  id: z.string().min(1, "Enrollment id is required"),
});