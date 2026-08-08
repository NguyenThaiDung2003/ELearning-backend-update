import { z } from "zod";

export const createOrderSchema = z.object({
  courseId: z.string().min(1, "Course id is required"),
});

export const captureOrderSchema = z.object({
  orderId: z.string().min(1, "Order id is required"),
});