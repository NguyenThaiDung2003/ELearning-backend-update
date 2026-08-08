"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const course_repository_1 = require("../repositories/course.repository");
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const paypal_1 = require("../utils/paypal");
class PaymentService {
    static async createOrder(courseId, userId) {
        const course = await course_repository_1.CourseRepository.findById(courseId);
        if (!course) {
            throw new Error("Course not found");
        }
        if (course.isFree || course.price <= 0) {
            throw new Error("This course does not require PayPal payment");
        }
        const existingEnrollment = await enrollment_repository_1.EnrollmentRepository.findByUserAndCourse(userId, courseId);
        if (existingEnrollment?.status === client_1.EnrollmentStatus.CONFIRMED) {
            throw new Error("Course already purchased");
        }
        try {
            const accessToken = await (0, paypal_1.getAccessToken)();
            const response = await axios_1.default.post(`${paypal_1.BASE_URL}/v2/checkout/orders`, {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: {
                            currency_code: "USD",
                            value: course.price.toFixed(2),
                        },
                        description: course.title,
                    },
                ],
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            const approveUrl = response.data.links?.find((link) => link.rel === "approve")?.href;
            if (!approveUrl) {
                throw new Error("PayPal approval URL not found");
            }
            const enrollment = existingEnrollment
                ? await enrollment_repository_1.EnrollmentRepository.updateStatus(existingEnrollment.id, client_1.EnrollmentStatus.PENDING, response.data.id)
                : await enrollment_repository_1.EnrollmentRepository.create(userId, courseId, client_1.EnrollmentStatus.PENDING);
            if (!existingEnrollment) {
                await enrollment_repository_1.EnrollmentRepository.updatePaypalOrderId(enrollment.id, response.data.id);
            }
            return {
                orderId: response.data.id,
                approveUrl,
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const message = error.response?.data?.message || error.response?.data?.error_description;
                throw new Error(message || "PayPal API failed while creating order");
            }
            throw error;
        }
    }
    static async captureOrder(orderId, userId) {
        const enrollment = await enrollment_repository_1.EnrollmentRepository.findByPaypalOrderId(orderId);
        if (!enrollment || enrollment.userId !== userId) {
            throw new Error("PayPal order not found");
        }
        if (enrollment.status === client_1.EnrollmentStatus.CONFIRMED) {
            throw new Error("This PayPal order has already been captured");
        }
        try {
            const accessToken = await (0, paypal_1.getAccessToken)();
            const response = await axios_1.default.post(`${paypal_1.BASE_URL}/v2/checkout/orders/${orderId}/capture`, {}, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (response.data.status !== "COMPLETED") {
                throw new Error("PayPal order capture was not completed");
            }
            return enrollment_repository_1.EnrollmentRepository.updateStatus(enrollment.id, client_1.EnrollmentStatus.CONFIRMED, orderId);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const issue = error.response?.data?.details?.[0]?.issue;
                const message = error.response?.data?.message;
                if (issue === "ORDER_ALREADY_CAPTURED") {
                    throw new Error("This PayPal order has already been captured");
                }
                if (issue === "RESOURCE_NOT_FOUND") {
                    throw new Error("PayPal order not found");
                }
                throw new Error(message || "PayPal API failed while capturing order");
            }
            throw error;
        }
    }
}
exports.PaymentService = PaymentService;
