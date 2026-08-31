// Phai nap .env truoc moi import khac: lib/prisma, jwt va cloudinary doc bien
// moi truong ngay luc module duoc load.
import "dotenv/config";

import compression from "compression";
import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { startAutoSubmitJob } from "./jobs/auto-submit.job";
import { prisma } from "./lib/prisma";
import { errorMiddleware } from "./middleware/error.middleware";
import { forbidden } from "./utils/errors";
import apiRoutes from "./routes";

const app = express();
const port = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === "production";

// CLIENT_URL nhan nhieu domain, ngan cach bang dau phay.
const allowedOrigins = (process.env.CLIENT_URL ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const LOCALHOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const resolveCorsOrigin: CorsOptions["origin"] = (origin, callback) => {
  // Khong co Origin: curl, Postman, health check.
  if (!origin) {
    return callback(null, true);
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // Khi chua cau hinh CLIENT_URL thi mo cho tat ca (moi clone ve la chay duoc).
  if (allowedOrigins.length === 0) {
    return callback(null, true);
  }

  // Dev: Vite tu nhay sang 5174, 5175... khi cong bi chiem, nen chap nhan
  // moi cong localhost thay vi bat dung mot so.
  if (!isProduction && LOCALHOST_PATTERN.test(origin)) {
    return callback(null, true);
  }

  // 403 thay vi de error middleware tra 500: origin la khong phai loi server.
  return callback(forbidden(`Origin khong duoc phep: ${origin}`));
};

// Man hinh lam bai auto-save 15s va bang diem poll 5s nen quota phai rong.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// Ca lop dang nhap cung luc tu mot IP truong nen quota 10 la qua chat.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication requests, please try again later.",
  },
});

app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({ origin: resolveCorsOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);
app.use("/api", apiRoutes);
app.use(errorMiddleware);

let server: ReturnType<typeof app.listen> | null = null;
let stopAutoSubmitJob: (() => void) | null = null;

const shutdown = async (signal: NodeJS.Signals) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  stopAutoSubmitJob?.();

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await prisma.$disconnect();
  process.exit(0);
};

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Prisma connected successfully");

    stopAutoSubmitJob = startAutoSubmitJob();

    server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

void startServer();