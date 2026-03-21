import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(`[Error] ${err.message}`, err.stack);

  // Prisma known request errors (e.g., unique constraint violation)
  if (err.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({
      success: false,
      error: { message: "Database operation failed", code: "DB_ERROR" },
    });
  }

  // Prisma validation errors (e.g., missing required fields)
  if (err.name === "PrismaClientValidationError") {
    return res.status(400).json({
      success: false,
      error: { message: "Invalid data provided", code: "VALIDATION_ERROR" },
    });
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: (err as any).errors,
      },
    });
  }

  // Default 500 -- hide internal details in production
  return res.status(500).json({
    success: false,
    error: { message: "Internal server error", code: "INTERNAL_ERROR" },
  });
}
