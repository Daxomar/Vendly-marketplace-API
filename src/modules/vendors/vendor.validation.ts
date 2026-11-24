import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

// POST /api/v1/admin/vendors
export const createVendorSchema = z.object({
  // The login for the vendor's account
  ownerName: z.string().trim().min(2).max(60),
  email: z.email(),
  // Optional: leave out while Vendly manages the account (admin uses impersonation)
  password: z.string().min(8).max(100).optional(),

  // The business
  businessName: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  categoryIds: z.array(objectId).max(5).optional(),
  pickupLocation: z
    .object({
      address: z.string().trim().max(200).optional(),
      area: z.string().trim().max(80).optional(),
      city: z.string().trim().max(80).optional(),
    })
    .optional(),

  // Approve straight away (default) or leave pending
  approve: z.boolean().default(true),
});

// GET /api/v1/admin/vendors?status=approved&page=1
export const listVendorsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "suspended"]).optional(),
  search: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const vendorIdParamsSchema = z.object({ vendorId: objectId });

// PATCH /api/v1/admin/vendors/:vendorId/status
export const setVendorStatusSchema = z.object({
  status: z.enum(["approved", "suspended", "pending"]),
});
