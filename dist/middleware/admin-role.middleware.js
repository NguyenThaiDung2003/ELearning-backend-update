"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoleMiddleware = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const adminRoleMiddleware = (req, res, next) => {
    if (req.user?.role !== client_1.UserRole.ADMIN) {
        return (0, response_1.sendError)(res, "Forbidden", 403);
    }
    return next();
};
exports.adminRoleMiddleware = adminRoleMiddleware;
