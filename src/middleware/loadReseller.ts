// Finds the logged-in reseller's profile and sets req.reseller.
// Use after requireAuth + requireRole("user").
import { Request, Response, NextFunction } from "express";
import { createResellerProfileForUser } from "../modules/profiles/profile.service.js";
import { forbidden } from "../utils/AppError.js";

export async function loadReseller(req: Request, _res: Response, next: NextFunction) {
  // Normally the profile already exists (made at sign-up); this also repairs it if not
  const reseller = await createResellerProfileForUser(req.user);

  if (reseller.status === "suspended") {
    throw forbidden("ACCOUNT_SUSPENDED", "Your reseller account is suspended. Contact Vendly support.");
  }

  req.reseller = reseller;
  next();
}
