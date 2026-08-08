import { CourseLevel, CourseStatus, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";

interface FindAllPublishedParams {
  page: number;
  limit: number;
  search?: string;
  level?: CourseLevel;
}

const buildPublishedWhere = ({ search, level }: { search?: string; level?: CourseLevel }): Prisma.CourseWhereInput => ({
  status: CourseStatus.PUBLISHED,
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

export class CourseRepository {
  static async findAllPublished({ page, limit, search, level }: FindAllPublishedParams) {
    return prisma.course.findMany({
      where: buildPublishedWhere({ search, level }),
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  static async findBySlug(slug: string) {
    return prisma.course.findFirst({
      where: {
        urlSlug: slug,
        status: CourseStatus.PUBLISHED,
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

  static async findById(id: string) {
    return prisma.course.findUnique({
      where: { id },
    });
  }

  static async create(data: Prisma.CourseCreateInput) {
    return prisma.course.create({
      data,
    });
  }

  static async update(id: string, data: Prisma.CourseUpdateInput) {
    return prisma.course.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.course.delete({
      where: { id },
    });
  }

  static async countAll(filters: { search?: string; level?: CourseLevel } = {}) {
    return prisma.course.count({
      where: buildPublishedWhere(filters),
    });
  }
}