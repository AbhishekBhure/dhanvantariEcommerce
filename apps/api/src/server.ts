import app from "./app.js";
import logger from "./lib/logger.js";
import prisma from "./lib/prisma.js";

const PORT = Number(process.env["PORT"] ?? 4000);

const server = app.listen(PORT, () => {
  logger.info(`🚀 Dhanvantari API running on http://localhost:${PORT}`);
  logger.info(`📋 Health: http://localhost:${PORT}/api/health`);
  logger.info(`🌍 Environment: ${process.env["NODE_ENV"] ?? "development"}`);
});

// ─── Graceful shutdown ────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    logger.info("HTTP server closed");
    await prisma.$disconnect();
    logger.info("Database connection closed");
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error("Force closing server after timeout");
    process.exit(1);
  }, 30000);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception — shutting down");
  process.exit(1);
});
