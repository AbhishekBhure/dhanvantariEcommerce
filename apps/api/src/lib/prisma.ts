import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}

prisma.$connect().then(() => {
  logger.info("Connected to the database");
}).catch((err) => {
  logger.error({ err }, "Failed to connect to the database");
});

export default prisma;
