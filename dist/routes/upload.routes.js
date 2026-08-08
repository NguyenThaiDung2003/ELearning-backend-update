"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload_controller_1 = require("../controllers/upload.controller");
const admin_auth_middleware_1 = require("../middleware/admin-auth.middleware");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            callback(new Error("Chi chap nhan file anh"));
            return;
        }
        callback(null, true);
    },
});
const router = (0, express_1.Router)();
router.use(admin_auth_middleware_1.adminAuthMiddleware);
router.post("/image", upload.single("image"), upload_controller_1.UploadController.uploadImage);
exports.default = router;
