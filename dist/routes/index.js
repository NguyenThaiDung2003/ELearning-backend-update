"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_routes_1 = __importDefault(require("./admin.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const course_routes_1 = __importDefault(require("./course.routes"));
const enrollment_routes_1 = __importDefault(require("./enrollment.routes"));
const lesson_routes_1 = __importDefault(require("./lesson.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const progress_routes_1 = __importDefault(require("./progress.routes"));
const upload_routes_1 = __importDefault(require("./upload.routes"));
const router = (0, express_1.Router)();
router.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is ready",
    });
});
router.use("/admin", admin_routes_1.default);
router.use("/auth", auth_routes_1.default);
router.use("/courses", course_routes_1.default);
router.use("/enrollments", enrollment_routes_1.default);
router.use("/lessons", lesson_routes_1.default);
router.use("/payments", payment_routes_1.default);
router.use("/progress", progress_routes_1.default);
router.use("/upload", upload_routes_1.default);
exports.default = router;
