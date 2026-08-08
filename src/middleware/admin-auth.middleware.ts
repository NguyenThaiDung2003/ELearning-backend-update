import { authMiddleware } from "./auth.middleware";
import { adminRoleMiddleware } from "./admin-role.middleware";

export const adminAuthMiddleware = [authMiddleware, adminRoleMiddleware];