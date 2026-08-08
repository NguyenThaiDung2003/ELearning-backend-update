import { z } from "zod";

export const updateProgressSchema = z.object({
  lessonId: z.string().min(1, "Lesson id is required"),
  completed: z.boolean(),
  watchedSeconds: z.number().int().min(0, "Watched seconds must be greater than or equal to 0"),
});

export const getCourseProgressParamsSchema = z.object({
  courseId: z.string().min(1, "Course id is required"),
});