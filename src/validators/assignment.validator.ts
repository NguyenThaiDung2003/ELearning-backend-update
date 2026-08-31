import { AssignmentStatus, AssignmentType } from "@prisma/client";
import { z } from "zod";

export const questionSchema = z
  .object({
    question: z.string().trim().min(1, "Noi dung cau hoi la bat buoc"),
    options: z
      .array(z.string().trim().min(1, "Dap an khong duoc de trong"))
      .min(2, "Can it nhat 2 dap an")
      .max(6, "Toi da 6 dap an"),
    correctAnswer: z.coerce.number().int().min(0, "Dap an dung khong hop le"),
    order: z.coerce.number().int().min(1).optional(),
  })
  .refine((data) => data.correctAnswer < data.options.length, {
    message: "Dap an dung phai nam trong danh sach lua chon",
    path: ["correctAnswer"],
  });

const assignmentBaseSchema = z.object({
  title: z.string().trim().min(1, "Tieu de bai tap la bat buoc"),
  // De bai: muc tieu, mo ta, tieu chi hoan thanh, cach danh gia.
  description: z.string().trim().max(20000).optional().nullable(),
  type: z.nativeEnum(AssignmentType),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Thoi luong phai lon hon 0")
    .max(600)
    .optional()
    .nullable(),
  openAt: z.coerce.date().optional().nullable(),
  closeAt: z.coerce.date().optional().nullable(),
  maxScore: z.coerce.number().min(0.1, "Diem toi da phai lon hon 0").default(10),
  status: z.nativeEnum(AssignmentStatus).optional(),
});

const hasValidWindow = (data: { openAt?: Date | null; closeAt?: Date | null }) =>
  !data.openAt || !data.closeAt || data.closeAt > data.openAt;

export const createAssignmentSchema = assignmentBaseSchema
  .extend({
    questions: z.array(questionSchema).optional(),
  })
  .refine(hasValidWindow, {
    message: "Thoi diem dong bai phai sau thoi diem mo bai",
    path: ["closeAt"],
  });

export const updateAssignmentSchema = assignmentBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Can it nhat mot truong de cap nhat bai tap",
  })
  .refine(hasValidWindow, {
    message: "Thoi diem dong bai phai sau thoi diem mo bai",
    path: ["closeAt"],
  });

export const replaceQuestionsSchema = z.object({
  questions: z.array(questionSchema).min(1, "Can it nhat 1 cau hoi"),
});

export const updateQuestionSchema = questionSchema;

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
