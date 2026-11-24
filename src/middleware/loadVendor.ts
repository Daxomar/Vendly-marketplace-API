// Finds the logged-in vendor's profile and sets req.vendor.
// Use after requireAuth + requireRole("vendor"). Only approved vendors pass.
import { Request, Response, NextFunction } from "express";
import { VendorProfile } from "../models/index.js";
import { forbidden } from "../utils/AppError.js";

export async function loadVendor(req: Request, _res: Response, next: NextFunction) {
  const vendor = await VendorProfile.findOne({ userId: req.user.id });

  if (!vendor) throw forbidden("VENDOR_PROFILE_MISSING", "No vendor profile for this account");
  if (vendor.status === "pending") throw forbidden("VENDOR_NOT_APPROVED", "Your vendor account is awaiting approval");
  if (vendor.status === "suspended") throw forbidden("ACCOUNT_SUSPENDED", "Your vendor account is suspended");

  req.vendor = vendor;
  next();
}
