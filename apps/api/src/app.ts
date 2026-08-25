import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import logger from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// ─── Route imports ────────────────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import adminRoutes from "./routes/admin/index.routes.js";

// ─── App Setup ────────────────────────────────────────────────

const app = express();

// ─── Trust proxy (for Vercel/reverse proxies) ────────────────
app.set("trust proxy", 1);

// ─── Security headers ─────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = [
  process.env["STOREFRONT_URL"] ?? "http://localhost:3000",
  process.env["ADMIN_URL"] ?? "http://localhost:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
  })
);

// ─── Request logging ──────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    customLogLevel(_req, res) {
      if (res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
        };
      },
    },
  })
);

// ─── Body parsing ─────────────────────────────────────────────
// Note: /api/payment/webhook needs raw body for signature verification
app.use((req, res, next) => {
  if (req.path === "/api/payment/webhook") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json({ limit: "10mb" })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Global rate limiting ─────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: Number(process.env["RATE_LIMIT_WINDOW_MS"] ?? 900000),
  max: Number(process.env["RATE_LIMIT_MAX"] ?? 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});
app.use("/api", globalLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

// ─── Health Check ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env["NODE_ENV"] ?? "unknown",
      version: "1.0.0",
    },
  });
});

// ─── Routes ───────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/admin", adminRoutes);

// ─── Error Handling ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
