"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};
exports.sendError = sendError;
