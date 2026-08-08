"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const errorMiddleware = (error, _req, res, _next) => {
    const isDevelopment = process.env.NODE_ENV !== "production";
    if (isDevelopment) {
        console.error("Unhandled error:", error);
    }
    else {
        console.error("Unhandled error:", error instanceof Error ? error.message : error);
    }
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            success: false,
            message: error.issues.map((issue) => issue.message).join(", "),
        });
    }
    const statusCode = typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    const message = error instanceof Error
        ? error.message
        : "Internal server error";
    return res.status(statusCode).json({
        success: false,
        message: statusCode >= 500 && !isDevelopment ? "Internal server error" : message,
    });
};
exports.errorMiddleware = errorMiddleware;
