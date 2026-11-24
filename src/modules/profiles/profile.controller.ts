// Controllers: read the request, call ONE service function, send the response.
// No try/catch (Express 5 forwards thrown errors to errorHandler).
import { Request, Response } from "express";
import * as profileService from "./profile.service.js";
import { ok } from "../../utils/respond.js";

// GET /api/v1/me (any logged-in user)
export async function getMe(req: Request, res: Response) {
  ok(res, await profileService.getMe(req.user));
}

// GET /api/v1/reseller/profile
export async function getResellerProfile(req: Request, res: Response) {
  ok(res, req.reseller); // already loaded by loadReseller
}

// PATCH /api/v1/reseller/profile
export async function updateResellerProfile(req: Request, res: Response) {
  ok(res, await profileService.updateResellerProfile(req.reseller._id, req.body));
}

// GET /api/v1/reseller/store-config
export async function getStoreConfig(req: Request, res: Response) {
  ok(res, await profileService.getStoreConfig(req.reseller._id));
}

// PATCH /api/v1/reseller/store-config
export async function updateStoreConfig(req: Request, res: Response) {
  ok(res, await profileService.updateStoreConfig(req.reseller._id, req.body));
}

// GET /api/v1/vendor/profile
export async function getVendorProfile(req: Request, res: Response) {
  ok(res, req.vendor); // already loaded by loadVendor
}

// PATCH /api/v1/vendor/profile
export async function updateVendorProfile(req: Request, res: Response) {
  ok(res, await profileService.updateVendorProfile(req.vendor._id, req.body));
}
