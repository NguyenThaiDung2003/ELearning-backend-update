import { z } from "zod";

export const saveAnswersSchema = z.object({
  answers: z.record(z.string(), z.coerce.number().int().min(0)),
});

export const submitQuizSchema = z.object({
  answers: z.record(z.string(), z.coerce.number().int().min(0)).optional(),
});

export const submitPracticalSchema = z
  .object({
    fileUrl: z.union([z.string().trim().url("Link file khong hop le"), z.literal("")]).optional(),
    submitLink: z.union([z.string().trim().url("Link nop bai khong hop le"), z.literal("")]).optional(),
  })
  .refine((data) => Boolean(data.fileUrl || data.submitLink), {
    message: "Can nop file hoac link bai lam",
  });

export const gradeSubmissionSchema = z.object({
  score: z.coerce.number().min(0, "Diem phai lon hon hoac bang 0"),
  feedback: z.string().trim().max(2000).optional().nullable(),
});

export type SaveAnswersInput = z.infer<typeof saveAnswersSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type SubmitPracticalInput = z.infer<typeof submitPracticalSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
