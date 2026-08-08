import { EnrollmentStatus, UserRole } from "@prisma/client";

import { CourseRepository } from "../repositories/course.repository";
import { EnrollmentRepository } from "../repositories/enrollment.repository";
import { ProgressRepository } from "../repositories/progress.repository";

export class EnrollmentService {
  static async enrollCourse(userId: string, courseId: string) {
    const course = await CourseRepository.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const targetStatus = course.isFree
      ? EnrollmentStatus.CONFIRMED
      : EnrollmentStatus.PENDING;

    const existingEnrollment = await EnrollmentRepository.findByUserAndCourse(userId, courseId);
    if (existingEnrollment) {
      if (existingEnrollment.status === targetStatus) {
        return existingEnrollment;
      }

      return EnrollmentRepository.updateStatus(existingEnrollment.id, targetStatus);
    }

    return EnrollmentRepository.create(userId, courseId, targetStatus);
  }

  static async getUserEnrollments(userId: string) {
    const enrollments = await EnrollmentRepository.findByUser(userId);

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await ProgressRepository.findCourseProgress(userId, enrollment.courseId);

        return {
          ...enrollment,
          progress,
        };
      }),
    );
  }

  static async confirmEnrollment(enrollmentId: string, role?: UserRole) {
    if (role !== UserRole.ADMIN) {
      throw new Error("Forbidden");
    }

    const enrollment = await EnrollmentRepository.findById(enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    return EnrollmentRepository.updateStatus(enrollmentId, EnrollmentStatus.CONFIRMED);
  }
}