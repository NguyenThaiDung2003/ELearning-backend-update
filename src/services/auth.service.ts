import { UserRole } from "@prisma/client";

import { AuthRepository } from "../repositories/auth.repository";
import { compareHash, hashValue } from "../utils/hash";
import { signJwt, verifyJwt } from "../utils/jwt";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret";
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface RefreshTokenPayload {
    userId: string;
    type: "refresh";
}

export class AuthService {
    static async register(email: string, password: string, name: string) {
        const existingUser = await AuthRepository.findUserByEmail(email);
        if (existingUser) {
            throw new Error("User already exists");
        }

        const hashedPassword = await hashValue(password);
        const user = await AuthRepository.createUser({
            email,
            password: hashedPassword,
            name,
        });

        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

        await AuthRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    static async login(email: string, password: string) {
        const user = await AuthRepository.findUserByEmail(email);
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isPasswordValid = await compareHash(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }

        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

        await AuthRepository.deleteAllRefreshTokens(user.id);
        await AuthRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    static async refreshToken(token: string) {
        let decoded: RefreshTokenPayload;

        try {
            decoded = verifyJwt<RefreshTokenPayload>(token, REFRESH_TOKEN_SECRET);
        } catch {
            throw new Error("Invalid or expired refresh token");
        }

        if (decoded.type !== "refresh") {
            throw new Error("Invalid or expired refresh token");
        }

        const refreshTokenData = await AuthRepository.findRefreshToken(token);
        if (
            !refreshTokenData ||
            refreshTokenData.userId !== decoded.userId ||
            refreshTokenData.expiresAt < new Date()
        ) {
            throw new Error("Invalid or expired refresh token");
        }

        return {
            accessToken: this.generateAccessToken(
                refreshTokenData.user.id,
                refreshTokenData.user.role,
            ),
        };
    }

    static async logout(token: string) {
        await AuthRepository.deleteRefreshToken(token);
    }

    private static generateAccessToken(userId: string, role: UserRole) {
        return signJwt(
            { userId, role },
            ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
        );
    }

    private static generateRefreshToken(userId: string) {
        return signJwt(
            { userId, type: "refresh" },
            REFRESH_TOKEN_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
        );
    }
}
