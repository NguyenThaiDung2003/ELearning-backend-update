import { z } from "zod";

export const createClassSchema = z.object({
  title: z.string().trim().min(1, "Ten lop hoc la bat buoc"),
  description: z.string().trim().max(2000).optional().nullable(),
  instructorId: z.string().trim().min(1).optional(),
});

export const updateClassSchema = z
  .object({
    title: z.string().trim().min(1, "Ten lop hoc la bat buoc").optional(),
    description: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Can it nhat mot truong de cap nhat lop hoc",
  });

export const addMemberSchema = z
  .object({
    userId: z.string().trim().min(1).optional(),
    email: z.email("Email khong hop le").trim().toLowerCase().optional(),
  })
  .refine((data) => Boolean(data.userId || data.email), {
    message: "Can userId hoac email cua sinh vien",
  });

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
