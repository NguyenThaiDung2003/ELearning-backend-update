import { prisma } from "../lib/prisma";

export class AuthRepository {
    static async findUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    static async findUserById(id: string) {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    static async createUser(data: { email: string; password: string; name: string }) {
        return prisma.user.create({
            data,
        });
    }

    static async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
        return prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    static async findRefreshToken(token: string) {
        return prisma.refreshToken.findUnique({
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

    static async deleteRefreshToken(token: string) {
        return prisma.refreshToken.deleteMany({
            where: { token },
        });
    }

    static async deleteAllRefreshTokens(userId: string) {
        return prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }
}
