"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureOrderSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
exports.createOrderSchema = zod_1.z.object({
    courseId: zod_1.z.string().min(1, "Course id is required"),
});
exports.captureOrderSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1, "Order id is required"),
});
