"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const response_1 = require("../utils/response");
const jwt_1 = require("../utils/jwt");
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret";
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return (0, response_1.sendError)(res, "Unauthorized", 401);
    }
    const token = authHeader.substring(7);
    try {
        const decoded = (0, jwt_1.verifyJwt)(token, ACCESS_TOKEN_SECRET);
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        return next();
    }
    catch {
        return (0, response_1.sendError)(res, "Invalid token", 401);
    }
};
exports.authMiddleware = authMiddleware;
