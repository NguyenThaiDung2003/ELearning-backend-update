import { UserRole } from "@prisma/client";
import { z } from "zod";

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  role: z.enum(["ALL", UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN]).default("ALL"),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const createUserSchema = z.object({
  email: z.email("Email khong hop le").trim().toLowerCase(),
  password: z.string().min(6, "Mat khau toi thieu 6 ky tu"),
  name: z.string().trim().min(1, "Ten la bat buoc"),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
