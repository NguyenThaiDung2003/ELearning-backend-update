import { z } from "zod";

const optionalLink = z
  .union([z.string().trim().url("Link khong hop le"), z.literal(""), z.null()])
  .optional();

export const createSessionSchema = z.object({
  title: z.string().trim().min(1, "Tieu de buoi hoc la bat buoc"),
  sessionDate: z.coerce.date("Ngay hoc khong hop le"),
  recordLink: optionalLink,
});

export const updateSessionSchema = z
  .object({
    title: z.string().trim().min(1, "Tieu de buoi hoc la bat buoc").optional(),
    sessionDate: z.coerce.date("Ngay hoc khong hop le").optional(),
    recordLink: optionalLink,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Can it nhat mot truong de cap nhat buoi hoc",
  });

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
