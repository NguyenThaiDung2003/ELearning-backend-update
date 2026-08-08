import { CourseLevel, CourseStatus, Prisma, UserRole } from "@prisma/client";

import { CourseRepository } from "../repositories/course.repository";
import { EnrollmentRepository } from "../repositories/enrollment.repository";

interface GetCoursesQuery {
  page: number;
  limit: number;
  search?: string;
  level?: CourseLevel;
}

interface CoursePayload {
  title: string;
  description: string;
  thumbnail?: string | null;
  price?: number;
  isFree?: boolean;
  urlSlug: string;
  level: CourseLevel;
  status?: CourseStatus;
}

export class CourseService {
  static async getCourses(query: GetCoursesQuery) {
    const [courses, total] = await Promise.all([
      CourseRepository.findAllPublished(query),
      CourseRepository.countAll({ search: query.search, level: query.level }),
    ]);

    return {
      items: courses,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  static async getCourseBySlug(slug: string, userId?: string) {
    const course = await CourseRepository.findBySlug(slug);
    if (!course) {
      throw new Error("Course not found");
    }

    const enrollment = userId
      ? await EnrollmentRepository.findByUserAndCourse(userId, course.id)
      : null;

    const hasFullAccess = enrollment?.status === "CONFIRMED";

    return {
      ...course,
      chapters: course.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          isFree: lesson.isFree,
          duration: lesson.duration,
          videoUrl: lesson.isFree || hasFullAccess ? lesson.videoUrl : null,
        })),
      })),
    };
  }

  static async createCourse(data: CoursePayload, role?: UserRole) {
    this.ensureAdmin(role);

    const payload: Prisma.CourseCreateInput = {
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail ?? null,
      price: data.isFree ? 0 : data.price ?? 0,
      isFree: data.isFree ?? false,
      urlSlug: data.urlSlug,
      level: data.level,
      status: data.status ?? CourseStatus.DRAFT,
    };

    return CourseRepository.create(payload);
  }

  static async updateCourse(id: string, data: Partial<CoursePayload>, role?: UserRole) {
    this.ensureAdmin(role);

    const existingCourse = await CourseRepository.findById(id);
    if (!existingCourse) {
      throw new Error("Course not found");
    }

    const isFree = data.isFree ?? existingCourse.isFree;
    const payload: Prisma.CourseUpdateInput = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.thumbnail !== undefined ? { thumbnail: data.thumbnail } : {}),
      ...(data.price !== undefined || data.isFree !== undefined
        ? { price: isFree ? 0 : data.price ?? existingCourse.price }
        : {}),
      ...(data.isFree !== undefined ? { isFree: data.isFree } : {}),
      ...(data.urlSlug !== undefined ? { urlSlug: data.urlSlug } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    };

    return CourseRepository.update(id, payload);
  }

  static async deleteCourse(id: string, role?: UserRole) {
    this.ensureAdmin(role);

    const existingCourse = await CourseRepository.findById(id);
    if (!existingCourse) {
      throw new Error("Course not found");
    }

    return CourseRepository.delete(id);
  }

  private static ensureAdmin(role?: UserRole) {
    if (role !== UserRole.ADMIN) {
      throw new Error("Forbidden");
    }
  }
}