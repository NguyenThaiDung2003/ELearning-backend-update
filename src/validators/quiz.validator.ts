import { z } from "zod";

export const submitQuizSchema = z.object({
  answers: z.array(z.number().int()).default([]),
});