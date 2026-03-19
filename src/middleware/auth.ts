import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import type { Request, Response, NextFunction } from "express";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({
      success: false,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
    return;
  }

  (req as any).session = session.session;
  (req as any).user = session.user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session || session.user.role !== "admin") {
    res.status(403).json({
      success: false,
      error: { message: "Forbidden", code: "FORBIDDEN" },
    });
    return;
  }

  (req as any).session = session.session;
  (req as any).user = session.user;
  next();
}
