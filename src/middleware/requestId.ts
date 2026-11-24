// Gives every request an id (req.id) and sends it back as X-Request-Id.
// When something fails, the error response includes it, so a user can
// quote "ref req_ab12…" and you can find the exact log line.
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = `req_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  res.setHeader("X-Request-Id", req.id);
  next();
}
