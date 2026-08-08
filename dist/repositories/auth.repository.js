"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const prisma_1 = require("../lib/prisma");
class AuthRepository {
    static async findUserByEmail(email) {
        return prisma_1.prisma.user.findUnique({
            where: { email },
        });
    }
    static async findUserById(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
        });
    }
    static async createUser(data) {
        return prisma_1.prisma.user.create({
            data,
        });
    }
    static async saveRefreshToken(userId, token, expiresAt) {
        return prisma_1.prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }
    static async findRefreshToken(token) {
        return prisma_1.prisma.refreshToken.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        avatar: true,
                        createdAt: true,
                    },
                },
            },
        });
    }
    static async deleteRefreshToken(token) {
        return prisma_1.prisma.refreshToken.deleteMany({
            where: { token },
        });
    }
    static async deleteAllRefreshTokens(userId) {
        return prisma_1.prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }
}
exports.AuthRepository = AuthRepository;
