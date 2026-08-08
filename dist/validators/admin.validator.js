"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleSchema = exports.adminUserListQuerySchema = exports.adminEnrollmentListQuerySchema = exports.updateLessonSchema = exports.createLessonSchema = exports.updateChapterSchema = exports.createChapterSchema = exports.updateAdminCourseSchema = exports.createAdminCourseSchema = exports.adminCourseListQuerySchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const optionalUrlSchema = zod_1.z.union([
    zod_1.z.string().trim().url("URL khong hop le"),
    zod_1.z.literal(""),
    zod_1.z.null(),
]).optional();
const courseBaseSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, "Tieu de khoa hoc la bat buoc"),
    description: zod_1.z.string().trim().min(1, "Mo ta khoa hoc la bat buoc"),
    price: zod_1.z.coerce.number().min(0, "Gia khoa hoc phai lon hon hoac bang 0"),
    isFree: zod_1.z.coerce.boolean().default(false),
    level: zod_1.z.nativeEnum(client_1.CourseLevel),
    thumbnail: optionalUrlSchema,
});
exports.adminCourseListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    status: zod_1.z.nativeEnum(client_1.CourseStatus).optional(),
    search: zod_1.z.string().trim().optional(),
});
exports.createAdminCourseSchema = courseBaseSchema.transform((data) => ({
    ...data,
    thumbnail: data.thumbnail || null,
    price: data.isFree ? 0 : data.price,
}));
exports.updateAdminCourseSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, "Tieu de khoa hoc la bat buoc").optional(),
    description: zod_1.z.string().trim().min(1, "Mo ta khoa hoc la bat buoc").optional(),
    price: zod_1.z.coerce.number().min(0, "Gia khoa hoc phai lon hon hoac bang 0").optional(),
    isFree: zod_1.z.coerce.boolean().optional(),
    level: zod_1.z.nativeEnum(client_1.CourseLevel).optional(),
    thumbnail: optionalUrlSchema,
    status: zod_1.z.nativeEnum(client_1.CourseStatus).optional(),
}).transform((data) => ({
    ...data,
    thumbnail: data.thumbnail === undefined ? undefined : data.thumbnail || null,
    price: data.isFree ? 0 : data.price,
}));
exports.createChapterSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, "Tieu de chapter la bat buoc"),
    order: zod_1.z.coerce.number().int().min(1, "Thu tu chapter phai lon hon 0"),
});
exports.updateChapterSchema = exports.createChapterSchema.partial().refine((data) => Object.keys(data).length > 0, { message: "Can it nhat mot truong de cap nhat chapter" });
const lessonBaseSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, "Tieu de bai hoc la bat buoc"),
    description: zod_1.z.string().trim().optional().nullable(),
    videoUrl: optionalUrlSchema,
    duration: zod_1.z.coerce.number().int().min(0, "Duration phai lon hon hoac bang 0").optional().nullable(),
    order: zod_1.z.coerce.number().int().min(1, "Thu tu bai hoc phai lon hon 0"),
    isFree: zod_1.z.coerce.boolean().default(false),
});
exports.createLessonSchema = lessonBaseSchema.transform((data) => ({
    ...data,
    description: data.description ?? null,
    videoUrl: data.videoUrl || null,
    duration: data.duration ?? null,
}));
exports.updateLessonSchema = lessonBaseSchema.partial().refine((data) => Object.keys(data).length > 0, { message: "Can it nhat mot truong de cap nhat bai hoc" }).transform((data) => ({
    ...data,
    description: data.description === undefined ? undefined : data.description ?? null,
    videoUrl: data.videoUrl === undefined ? undefined : data.videoUrl || null,
    duration: data.duration === undefined ? undefined : data.duration ?? null,
}));
exports.adminEnrollmentListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    status: zod_1.z.nativeEnum(client_1.EnrollmentStatus).optional(),
    search: zod_1.z.string().trim().optional(),
});
exports.adminUserListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    search: zod_1.z.string().trim().optional(),
    role: zod_1.z.enum(["ALL", client_1.UserRole.STUDENT, client_1.UserRole.ADMIN]).default("ALL"),
});
exports.updateUserRoleSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(client_1.UserRole),
});
