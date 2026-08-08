"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMiddleware = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const validateMiddleware = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        return next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
        }
        return (0, response_1.sendError)(res, "Validation failed", 400);
    }
};
exports.validateMiddleware = validateMiddleware;
