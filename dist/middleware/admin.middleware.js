"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const response_1 = require("../utils/response");
const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== "ADMIN") {
        return (0, response_1.sendError)(res, "Forbidden", 403);
    }
    return next();
};
exports.adminMiddleware = adminMiddleware;
