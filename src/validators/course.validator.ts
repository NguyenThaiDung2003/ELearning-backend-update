import { CourseLevel, CourseStatus } from "@prisma/client";
import { z } from "zod";

const courseBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  thumbnail: z.union([z.string().trim().url("Thumbnail must be a valid URL"), z.literal("")]).optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  isFree: z.boolean().default(false),
  urlSlug: z.string().trim().min(1, "Slug is required"),
  level: z.nativeEnum(CourseLevel),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
});

export const getCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().optional(),
  level: z.nativeEnum(CourseLevel).optional(),
});

export const createCourseSchema = courseBodySchema.transform((data) => ({
  ...data,
  thumbnail: data.thumbnail || null,
  price: data.isFree ? 0 : data.price,
}));

export const updateCourseSchema = courseBodySchema.partial().transform((data) => ({
  ...data,
  thumbnail: data.thumbnail === undefined ? undefined : data.thumbnail || null,
  price: data.isFree ? 0 : data.price,
}));

export type GetCoursesQueryInput = z.infer<typeof getCoursesQuerySchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;