import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export function validate(schema: z.ZodObject<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(422).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: result.error.issues,
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodObject<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(422).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: result.error.issues,
        },
      });
      return;
    }

    (req as any).validatedQuery = result.data;
    next();
  };
}
