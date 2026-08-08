"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_repository_1 = require("../repositories/auth.repository");
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const auth_validator_1 = require("../validators/auth.validator");
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
class AuthController {
    static async register(req, res) {
        try {
            const { email, password, name } = auth_validator_1.registerSchema.parse(req.body);
            const result = await auth_service_1.AuthService.register(email, password, name);
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);
            return (0, response_1.sendSuccess)(res, {
                accessToken: result.accessToken,
                user: result.user,
            }, 201);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Registration failed";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = auth_validator_1.loginSchema.parse(req.body);
            const result = await auth_service_1.AuthService.login(email, password);
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);
            return (0, response_1.sendSuccess)(res, {
                accessToken: result.accessToken,
                user: result.user,
            });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return (0, response_1.sendError)(res, error.issues.map((issue) => issue.message).join(", "), 400);
            }
            const message = error instanceof Error ? error.message : "Login failed";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async logout(req, res) {
        try {
            const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
            if (refreshToken) {
                await auth_service_1.AuthService.logout(refreshToken);
            }
            res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
            return (0, response_1.sendSuccess)(res, { message: "Logout successful" });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Logout failed";
            return (0, response_1.sendError)(res, message, 400);
        }
    }
    static async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
            if (!refreshToken) {
                return (0, response_1.sendError)(res, "Refresh token not found", 401);
            }
            const result = await auth_service_1.AuthService.refreshToken(refreshToken);
            return (0, response_1.sendSuccess)(res, { accessToken: result.accessToken });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Token refresh failed";
            return (0, response_1.sendError)(res, message, 401);
        }
    }
    static async getMe(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendError)(res, "Unauthorized", 401);
            }
            const user = await auth_repository_1.AuthRepository.findUserById(req.user.userId);
            if (!user) {
                return (0, response_1.sendError)(res, "User not found", 404);
            }
            return (0, response_1.sendSuccess)(res, {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                createdAt: user.createdAt,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to get user info";
            return (0, response_1.sendError)(res, message, 500);
        }
    }
}
exports.AuthController = AuthController;
