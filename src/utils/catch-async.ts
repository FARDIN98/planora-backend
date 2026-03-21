import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function catchAsync(fn: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error: any) => {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        error: {
          message: error.message || "Internal server error",
          code: error.code || "INTERNAL_ERROR",
        },
      });
    });
  };
}
