"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.email("Invalid email format").trim().toLowerCase(),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
    name: zod_1.z.string().trim().min(1, "Name is required"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email("Invalid email format").trim().toLowerCase(),
    password: zod_1.z.string().min(1, "Password is required"),
});
