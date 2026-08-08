import { z } from "zod";

export const registerSchema = z.object({
    email: z.email("Invalid email format").trim().toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    name: z.string().trim().min(1, "Name is required"),
});

export const loginSchema = z.object({
    email: z.email("Invalid email format").trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
