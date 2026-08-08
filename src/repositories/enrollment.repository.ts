import { EnrollmentStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";

export class EnrollmentRepository {
  static async findByUserAndCourse(userId: string, courseId: string) {
    return prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });
  }

  static async findByUser(userId: string) {
    return prisma.enrollment.findMany({
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

  static async findById(id: string) {
    return prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });
  }

  static async findByPaypalOrderId(paypalOrderId: string) {
    return prisma.enrollment.findFirst({
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

  static async create(userId: string, courseId: string, status: EnrollmentStatus) {
    return prisma.enrollment.create({
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

  static async updateStatus(id: string, status: EnrollmentStatus, paypalOrderId?: string) {
    return prisma.enrollment.update({
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

  static async updatePaypalOrderId(id: string, paypalOrderId: string) {
    return prisma.enrollment.update({
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
    return prisma.enrollment.count();
  }
}