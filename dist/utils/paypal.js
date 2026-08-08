"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessToken = exports.BASE_URL = void 0;
const axios_1 = __importDefault(require("axios"));
exports.BASE_URL = process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;
const getAccessToken = async () => {
    const now = Date.now();
    if (cachedAccessToken && now < cachedAccessTokenExpiresAt) {
        return cachedAccessToken;
    }
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials are not configured");
    }
    try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const response = await axios_1.default.post(`${exports.BASE_URL}/v1/oauth2/token`, new URLSearchParams({ grant_type: "client_credentials" }).toString(), {
            headers: {
                Authorization: `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        cachedAccessToken = response.data.access_token;
        cachedAccessTokenExpiresAt = now + Math.min(response.data.expires_in, 3600) * 1000;
        return cachedAccessToken;
    }
    catch (error) {
        throw new Error("Failed to authenticate with PayPal");
    }
};
exports.getAccessToken = getAccessToken;
