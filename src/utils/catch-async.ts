import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function catchAsync(fn: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error: any) => {
      if (res.headersSent) return next(error);

      const status = error.status || 500;
      if (status >= 500) {
        console.error(`[catchAsync] ${req.method} ${req.path}:`, error);
      }
      res.status(status).json({
        success: false,
        error: {
          message: status >= 500 ? "Internal server error" : (error.message || "Internal server error"),
          code: status >= 500 ? "INTERNAL_ERROR" : (error.code || "INTERNAL_ERROR"),
        },
      });
    });
  };
}
