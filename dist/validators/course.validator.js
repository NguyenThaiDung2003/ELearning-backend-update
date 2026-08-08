"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCourseSchema = exports.createCourseSchema = exports.getCoursesQuerySchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const courseBodySchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, "Title is required"),
    description: zod_1.z.string().trim().min(1, "Description is required"),
    thumbnail: zod_1.z.union([zod_1.z.string().trim().url("Thumbnail must be a valid URL"), zod_1.z.literal("")]).optional(),
    price: zod_1.z.number().min(0, "Price must be greater than or equal to 0"),
    isFree: zod_1.z.boolean().default(false),
    urlSlug: zod_1.z.string().trim().min(1, "Slug is required"),
    level: zod_1.z.nativeEnum(client_1.CourseLevel),
    status: zod_1.z.nativeEnum(client_1.CourseStatus).default(client_1.CourseStatus.DRAFT),
});
exports.getCoursesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(12),
    search: zod_1.z.string().trim().optional(),
    level: zod_1.z.nativeEnum(client_1.CourseLevel).optional(),
});
exports.createCourseSchema = courseBodySchema.transform((data) => ({
    ...data,
    thumbnail: data.thumbnail || null,
    price: data.isFree ? 0 : data.price,
}));
exports.updateCourseSchema = courseBodySchema.partial().transform((data) => ({
    ...data,
    thumbnail: data.thumbnail === undefined ? undefined : data.thumbnail || null,
    price: data.isFree ? 0 : data.price,
}));
