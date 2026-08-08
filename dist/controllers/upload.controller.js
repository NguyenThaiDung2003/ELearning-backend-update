"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const cloudinary_1 = require("../utils/cloudinary");
const response_1 = require("../utils/response");
const uploadBufferToCloudinary = (buffer) => new Promise((resolve, reject) => {
    const stream = cloudinary_1.cloudinary.uploader.upload_stream({
        folder: "elearning",
        resource_type: "image",
    }, (error, result) => {
        if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
        }
        resolve(result.secure_url);
    });
    stream.end(buffer);
});
class UploadController {
    static async uploadImage(req, res) {
        try {
            if (!req.file) {
                return (0, response_1.sendError)(res, "Vui long chon file anh", 400);
            }
            const url = await uploadBufferToCloudinary(req.file.buffer);
            return (0, response_1.sendSuccess)(res, { url }, 201);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to upload image";
            return (0, response_1.sendError)(res, message, 500);
        }
    }
}
exports.UploadController = UploadController;
