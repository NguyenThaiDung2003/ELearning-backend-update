import axios from "axios";
import { EnrollmentStatus } from "@prisma/client";

import { CourseRepository } from "../repositories/course.repository";
import { EnrollmentRepository } from "../repositories/enrollment.repository";
import { BASE_URL, getAccessToken } from "../utils/paypal";

interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface PayPalCreateOrderResponse {
  id: string;
  status: string;
  links?: PayPalLink[];
}

interface PayPalCaptureResponse {
  id: string;
  status: string;
}

export class PaymentService {
  static async createOrder(courseId: string, userId: string) {
    const course = await CourseRepository.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (course.isFree || course.price <= 0) {
      throw new Error("This course does not require PayPal payment");
    }

    const existingEnrollment = await EnrollmentRepository.findByUserAndCourse(userId, courseId);
    if (existingEnrollment?.status === EnrollmentStatus.CONFIRMED) {
      throw new Error("Course already purchased");
    }

    try {
      const accessToken = await getAccessToken();
      const response = await axios.post<PayPalCreateOrderResponse>(
        `${BASE_URL}/v2/checkout/orders`,
        {
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
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const approveUrl = response.data.links?.find((link) => link.rel === "approve")?.href;
      if (!approveUrl) {
        throw new Error("PayPal approval URL not found");
      }

      const enrollment = existingEnrollment
        ? await EnrollmentRepository.updateStatus(existingEnrollment.id, EnrollmentStatus.PENDING, response.data.id)
        : await EnrollmentRepository.create(userId, courseId, EnrollmentStatus.PENDING);

      if (!existingEnrollment) {
        await EnrollmentRepository.updatePaypalOrderId(enrollment.id, response.data.id);
      }

      return {
        orderId: response.data.id,
        approveUrl,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.response?.data?.error_description;
        throw new Error(message || "PayPal API failed while creating order");
      }

      throw error;
    }
  }

  static async captureOrder(orderId: string, userId: string) {
    const enrollment = await EnrollmentRepository.findByPaypalOrderId(orderId);
    if (!enrollment || enrollment.userId !== userId) {
      throw new Error("PayPal order not found");
    }

    if (enrollment.status === EnrollmentStatus.CONFIRMED) {
      throw new Error("This PayPal order has already been captured");
    }

    try {
      const accessToken = await getAccessToken();
      const response = await axios.post<PayPalCaptureResponse>(
        `${BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.status !== "COMPLETED") {
        throw new Error("PayPal order capture was not completed");
      }

      return EnrollmentRepository.updateStatus(enrollment.id, EnrollmentStatus.CONFIRMED, orderId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
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