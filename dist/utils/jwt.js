"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwt = exports.signJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signJwt = (payload, secret, options) => jsonwebtoken_1.default.sign(payload, secret, options);
exports.signJwt = signJwt;
const verifyJwt = (token, secret) => jsonwebtoken_1.default.verify(token, secret);
exports.verifyJwt = verifyJwt;
