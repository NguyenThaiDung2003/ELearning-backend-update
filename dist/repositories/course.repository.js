"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const buildPublishedWhere = ({ search, level }) => ({
    status: client_1.CourseStatus.PUBLISHED,
    ...(search
        ? {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ],
        }
        : {}),
    ...(level ? { level } : {}),
});
class CourseRepository {
    static async findAllPublished({ page, limit, search, level }) {
        return prisma_1.prisma.course.findMany({
            where: buildPublishedWhere({ search, level }),
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });
    }
    static async findBySlug(slug) {
        return prisma_1.prisma.course.findFirst({
            where: {
                urlSlug: slug,
                status: client_1.CourseStatus.PUBLISHED,
            },
            include: {
                chapters: {
                    orderBy: { order: "asc" },
                    include: {
                        lessons: {
                            orderBy: { order: "asc" },
                            select: {
                                id: true,
                                title: true,
                                order: true,
                                isFree: true,
                                duration: true,
                                videoUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }
    static async findById(id) {
        return prisma_1.prisma.course.findUnique({
            where: { id },
        });
    }
    static async create(data) {
        return prisma_1.prisma.course.create({
            data,
        });
    }
    static async update(id, data) {
        return prisma_1.prisma.course.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        return prisma_1.prisma.course.delete({
            where: { id },
        });
    }
    static async countAll(filters = {}) {
        return prisma_1.prisma.course.count({
            where: buildPublishedWhere(filters),
        });
    }
}
exports.CourseRepository = CourseRepository;
