"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentRepository = void 0;
const prisma_1 = require("../lib/prisma");
class EnrollmentRepository {
    static async findByUserAndCourse(userId, courseId) {
        return prisma_1.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });
    }
    static async findByUser(userId) {
        return prisma_1.prisma.enrollment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                        price: true,
                        isFree: true,
                        urlSlug: true,
                        level: true,
                        status: true,
                    },
                },
            },
        });
    }
    static async findById(id) {
        return prisma_1.prisma.enrollment.findUnique({
            where: { id },
            include: {
                course: true,
            },
        });
    }
    static async findByPaypalOrderId(paypalOrderId) {
        return prisma_1.prisma.enrollment.findFirst({
            where: { paypalOrderId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                        price: true,
                        isFree: true,
                        urlSlug: true,
                        level: true,
                        status: true,
                    },
                },
            },
        });
    }
    static async create(userId, courseId, status) {
        return prisma_1.prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                        price: true,
                        isFree: true,
                        urlSlug: true,
                        level: true,
                        status: true,
                    },
                },
            },
        });
    }
    static async updateStatus(id, status, paypalOrderId) {
        return prisma_1.prisma.enrollment.update({
            where: { id },
            data: {
                status,
                ...(paypalOrderId !== undefined ? { paypalOrderId } : {}),
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                        price: true,
                        isFree: true,
                        urlSlug: true,
                        level: true,
                        status: true,
                    },
                },
            },
        });
    }
    static async updatePaypalOrderId(id, paypalOrderId) {
        return prisma_1.prisma.enrollment.update({
            where: { id },
            data: { paypalOrderId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                        price: true,
                        isFree: true,
                        urlSlug: true,
                        level: true,
                        status: true,
                    },
                },
            },
        });
    }
    static async countAll() {
        return prisma_1.prisma.enrollment.count();
    }
}
exports.EnrollmentRepository = EnrollmentRepository;
