import { verifyToken } from "../lib/jwt.js";
import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
    return;
  }

  try {
    const token = authHeader.split(" ")[1]!;
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1]!;
      const payload = verifyToken(token);
      (req as any).user = payload;
    } catch {
      // Invalid token -- continue as anonymous
    }
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if ((req as any).user.role !== "admin") {
      res.status(403).json({
        success: false,
        error: { message: "Forbidden", code: "FORBIDDEN" },
      });
      return;
    }
    next();
  });
}
