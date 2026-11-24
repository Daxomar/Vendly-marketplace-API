// Only lets the listed roles through. Use after requireAuth.
//   requireRole("admin")   requireRole("vendor")   requireRole("user")  // user = reseller
import { Request, Response, NextFunction } from "express";
import { forbidden, unauthorized } from "../utils/AppError.js";

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!allowedRoles.includes(req.user.role)) {
      throw forbidden("INSUFFICIENT_PERMISSIONS", `Requires role: ${allowedRoles.join(" or ")}`);
    }
    next();
  };
};
