"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_repository_1 = require("../repositories/auth.repository");
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret";
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
class AuthService {
    static async register(email, password, name) {
        const existingUser = await auth_repository_1.AuthRepository.findUserByEmail(email);
        if (existingUser) {
            throw new Error("User already exists");
        }
        const hashedPassword = await (0, hash_1.hashValue)(password);
        const user = await auth_repository_1.AuthRepository.createUser({
            email,
            password: hashedPassword,
            name,
        });
        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
        await auth_repository_1.AuthRepository.saveRefreshToken(user.id, refreshToken, expiresAt);
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
    static async login(email, password) {
        const user = await auth_repository_1.AuthRepository.findUserByEmail(email);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        const isPasswordValid = await (0, hash_1.compareHash)(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }
        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
        await auth_repository_1.AuthRepository.deleteAllRefreshTokens(user.id);
        await auth_repository_1.AuthRepository.saveRefreshToken(user.id, refreshToken, expiresAt);
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
    static async refreshToken(token) {
        let decoded;
        try {
            decoded = (0, jwt_1.verifyJwt)(token, REFRESH_TOKEN_SECRET);
        }
        catch {
            throw new Error("Invalid or expired refresh token");
        }
        if (decoded.type !== "refresh") {
            throw new Error("Invalid or expired refresh token");
        }
        const refreshTokenData = await auth_repository_1.AuthRepository.findRefreshToken(token);
        if (!refreshTokenData ||
            refreshTokenData.userId !== decoded.userId ||
            refreshTokenData.expiresAt < new Date()) {
            throw new Error("Invalid or expired refresh token");
        }
        return {
            accessToken: this.generateAccessToken(refreshTokenData.user.id, refreshTokenData.user.role),
        };
    }
    static async logout(token) {
        await auth_repository_1.AuthRepository.deleteRefreshToken(token);
    }
    static generateAccessToken(userId, role) {
        return (0, jwt_1.signJwt)({ userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    }
    static generateRefreshToken(userId) {
        return (0, jwt_1.signJwt)({ userId, type: "refresh" }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    }
}
exports.AuthService = AuthService;
