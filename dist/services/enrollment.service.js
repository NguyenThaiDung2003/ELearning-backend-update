"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentService = void 0;
const client_1 = require("@prisma/client");
const course_repository_1 = require("../repositories/course.repository");
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const progress_repository_1 = require("../repositories/progress.repository");
class EnrollmentService {
    static async enrollCourse(userId, courseId) {
        const course = await course_repository_1.CourseRepository.findById(courseId);
        if (!course) {
            throw new Error("Course not found");
        }
        const targetStatus = course.isFree
            ? client_1.EnrollmentStatus.CONFIRMED
            : client_1.EnrollmentStatus.PENDING;
        const existingEnrollment = await enrollment_repository_1.EnrollmentRepository.findByUserAndCourse(userId, courseId);
        if (existingEnrollment) {
            if (existingEnrollment.status === targetStatus) {
                return existingEnrollment;
            }
            return enrollment_repository_1.EnrollmentRepository.updateStatus(existingEnrollment.id, targetStatus);
        }
        return enrollment_repository_1.EnrollmentRepository.create(userId, courseId, targetStatus);
    }
    static async getUserEnrollments(userId) {
        const enrollments = await enrollment_repository_1.EnrollmentRepository.findByUser(userId);
        return Promise.all(enrollments.map(async (enrollment) => {
            const progress = await progress_repository_1.ProgressRepository.findCourseProgress(userId, enrollment.courseId);
            return {
                ...enrollment,
                progress,
            };
        }));
    }
    static async confirmEnrollment(enrollmentId, role) {
        if (role !== client_1.UserRole.ADMIN) {
            throw new Error("Forbidden");
        }
        const enrollment = await enrollment_repository_1.EnrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
            throw new Error("Enrollment not found");
        }
        return enrollment_repository_1.EnrollmentRepository.updateStatus(enrollmentId, client_1.EnrollmentStatus.CONFIRMED);
    }
}
exports.EnrollmentService = EnrollmentService;
