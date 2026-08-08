"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHash = exports.hashValue = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SALT_ROUNDS = 10;
const hashValue = async (value) => bcryptjs_1.default.hash(value, SALT_ROUNDS);
exports.hashValue = hashValue;
const compareHash = async (value, hashedValue) => bcryptjs_1.default.compare(value, hashedValue);
exports.compareHash = compareHash;
