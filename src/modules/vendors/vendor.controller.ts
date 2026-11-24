import { Request, Response } from "express";
import * as vendorService from "./vendor.service.js";
import { ok, created } from "../../utils/respond.js";

// POST /api/v1/admin/vendors
export async function createVendor(req: Request, res: Response) {
  created(res, await vendorService.createVendor(req.body));
}

// GET /api/v1/admin/vendors
export async function listVendors(req: Request, res: Response) {
  const { items, meta } = await vendorService.listVendors(req.validated.query);
  ok(res, items, meta);
}

// GET /api/v1/admin/vendors/:vendorId
export async function getVendor(req: Request, res: Response) {
  ok(res, await vendorService.getVendor(req.validated.params.vendorId));
}

// PATCH /api/v1/admin/vendors/:vendorId/status
export async function setVendorStatus(req: Request, res: Response) {
  ok(res, await vendorService.setVendorStatus(req.validated.params.vendorId, req.body.status));
}
