// Checks the Better Auth session cookie and sets req.user.
// No session → 401. Banned users never get a session (Better Auth handles that).
import { Request, Response, NextFunction } from "express";
import { getSessionFromRequest } from "../config/auth.js";
import { unauthorized } from "../utils/AppError.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const session: any = await getSessionFromRequest(req.headers);
  if (!session?.user) throw unauthorized();

  req.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role || "user",
    emailVerified: session.user.emailVerified,
    // Set when an admin is "acting as" this user (impersonation)
    impersonatedBy: session.session?.impersonatedBy || undefined,
  };

  next();
}
