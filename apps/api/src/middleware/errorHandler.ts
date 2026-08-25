import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import logger from "../lib/logger.js";
import { ApiError } from "@dhanvantari/shared-types";

// ─── Custom App Error ─────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, "BAD_REQUEST");
  }
}

// ─── Global Error Handler ─────────────────────────────────────

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "root";
      if (!errors[key]) errors[key] = [];
      errors[key]!.push(issue.message);
    }
    const response: ApiError = {
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors,
    };
    res.status(400).json(response);
    return;
  }

  // Operational / known errors
  if (err instanceof AppError) {
    const response: ApiError = {
      success: false,
      message: err.message,
      code: err.code,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = (err.meta?.["target"] as string[])?.join(", ") ?? "field";
      const response: ApiError = {
        success: false,
        message: `A record with this ${field} already exists`,
        code: "UNIQUE_CONSTRAINT",
      };
      res.status(409).json(response);
      return;
    }

    if (err.code === "P2025") {
      const response: ApiError = {
        success: false,
        message: "Record not found",
        code: "NOT_FOUND",
      };
      res.status(404).json(response);
      return;
    }
  }

  // Unknown / unexpected errors — log and return 500
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");

  const response: ApiError = {
    success: false,
    message:
      process.env["NODE_ENV"] === "production"
        ? "An unexpected error occurred. Please try again later."
        : (err instanceof Error ? err.message : "Unknown error"),
    code: "INTERNAL_ERROR",
  };
  res.status(500).json(response);
}

// ─── 404 Handler ─────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiError = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: "NOT_FOUND",
  };
  res.status(404).json(response);
}
