"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = void 0;
const auth_middleware_1 = require("./auth.middleware");
const admin_role_middleware_1 = require("./admin-role.middleware");
exports.adminAuthMiddleware = [auth_middleware_1.authMiddleware, admin_role_middleware_1.adminRoleMiddleware];
