import { CourseLevel, CourseStatus, EnrollmentStatus, UserRole } from "@prisma/client";
import { z } from "zod";

const optionalUrlSchema = z.union([
  z.string().trim().url("URL khong hop le"),
  z.literal(""),
  z.null(),
]).optional();

const courseBaseSchema = z.object({
  title: z.string().trim().min(1, "Tieu de khoa hoc la bat buoc"),
  description: z.string().trim().min(1, "Mo ta khoa hoc la bat buoc"),
  price: z.coerce.number().min(0, "Gia khoa hoc phai lon hon hoac bang 0"),
  isFree: z.coerce.boolean().default(false),
  level: z.nativeEnum(CourseLevel),
  thumbnail: optionalUrlSchema,
});

export const adminCourseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(CourseStatus).optional(),
  search: z.string().trim().optional(),
});

export const createAdminCourseSchema = courseBaseSchema.transform((data) => ({
  ...data,
  thumbnail: data.thumbnail || null,
  price: data.isFree ? 0 : data.price,
}));

export const updateAdminCourseSchema = z.object({
  title: z.string().trim().min(1, "Tieu de khoa hoc la bat buoc").optional(),
  description: z.string().trim().min(1, "Mo ta khoa hoc la bat buoc").optional(),
  price: z.coerce.number().min(0, "Gia khoa hoc phai lon hon hoac bang 0").optional(),
  isFree: z.coerce.boolean().optional(),
  level: z.nativeEnum(CourseLevel).optional(),
  thumbnail: optionalUrlSchema,
  status: z.nativeEnum(CourseStatus).optional(),
}).transform((data) => ({
  ...data,
  thumbnail: data.thumbnail === undefined ? undefined : data.thumbnail || null,
  price: data.isFree ? 0 : data.price,
}));

export const createChapterSchema = z.object({
  title: z.string().trim().min(1, "Tieu de chapter la bat buoc"),
  order: z.coerce.number().int().min(1, "Thu tu chapter phai lon hon 0"),
});

export const updateChapterSchema = createChapterSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Can it nhat mot truong de cap nhat chapter" },
);

const lessonBaseSchema = z.object({
  title: z.string().trim().min(1, "Tieu de bai hoc la bat buoc"),
  description: z.string().trim().optional().nullable(),
  videoUrl: optionalUrlSchema,
  duration: z.coerce.number().int().min(0, "Duration phai lon hon hoac bang 0").optional().nullable(),
  order: z.coerce.number().int().min(1, "Thu tu bai hoc phai lon hon 0"),
  isFree: z.coerce.boolean().default(false),
});

export const createLessonSchema = lessonBaseSchema.transform((data) => ({
  ...data,
  description: data.description ?? null,
  videoUrl: data.videoUrl || null,
  duration: data.duration ?? null,
}));

export const updateLessonSchema = lessonBaseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Can it nhat mot truong de cap nhat bai hoc" },
).transform((data) => ({
  ...data,
  description: data.description === undefined ? undefined : data.description ?? null,
  videoUrl: data.videoUrl === undefined ? undefined : data.videoUrl || null,
  duration: data.duration === undefined ? undefined : data.duration ?? null,
}));

export const adminEnrollmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(EnrollmentStatus).optional(),
  search: z.string().trim().optional(),
});

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  role: z.enum(["ALL", UserRole.STUDENT, UserRole.ADMIN]).default("ALL"),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});