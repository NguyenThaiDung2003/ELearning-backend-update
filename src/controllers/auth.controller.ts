import { Request, Response } from "express";
import { ZodError } from "zod";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AuthRepository } from "../repositories/auth.repository";
import { AuthService } from "../services/auth.service";
import { sendError, sendSuccess } from "../utils/response";
import {
    LoginInput,
    RegisterInput,
    loginSchema,
    registerSchema,
} from "../validators/auth.validator";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const { email, password, name }: RegisterInput = registerSchema.parse(req.body);
            const result = await AuthService.register(email, password, name);

            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

            return sendSuccess(
                res,
                {
                    accessToken: result.accessToken,
                    user: result.user,
                },
                201,
            );
        } catch (error) {
            if (error instanceof ZodError) {
                return sendError(
                    res,
                    error.issues.map((issue) => issue.message).join(", "),
                    400,
                );
            }

            const message = error instanceof Error ? error.message : "Registration failed";
            return sendError(res, message, 400);
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password }: LoginInput = loginSchema.parse(req.body);
            const result = await AuthService.login(email, password);

            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

            return sendSuccess(res, {
                accessToken: result.accessToken,
                user: result.user,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                return sendError(
                    res,
                    error.issues.map((issue) => issue.message).join(", "),
                    400,
                );
            }

            const message = error instanceof Error ? error.message : "Login failed";
            return sendError(res, message, 400);
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

            if (refreshToken) {
                await AuthService.logout(refreshToken);
            }

            res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);

            return sendSuccess(res, { message: "Logout successful" });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Logout failed";
            return sendError(res, message, 400);
        }
    }

    static async refreshToken(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

            if (!refreshToken) {
                return sendError(res, "Refresh token not found", 401);
            }

            const result = await AuthService.refreshToken(refreshToken);
            return sendSuccess(res, { accessToken: result.accessToken });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Token refresh failed";
            return sendError(res, message, 401);
        }
    }

    static async getMe(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return sendError(res, "Unauthorized", 401);
            }

            const user = await AuthRepository.findUserById(req.user.userId);
            if (!user) {
                return sendError(res, "User not found", 404);
            }

            return sendSuccess(res, {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                createdAt: user.createdAt,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to get user info";
            return sendError(res, message, 500);
        }
    }
}
