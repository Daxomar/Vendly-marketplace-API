// ADMIN routes, mounted at /api/v1/admin. Every route: logged in → role "admin".
// User management (list users, ban, impersonate) comes from Better Auth's
// admin plugin at /api/auth/admin/*, so it isn't repeated here.
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { generalLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import * as vendorController from "../modules/vendors/vendor.controller.js";
import {
  createVendorSchema,
  listVendorsQuerySchema,
  vendorIdParamsSchema,
  setVendorStatusSchema,
} from "../modules/vendors/vendor.validation.js";

const router = Router();

router.use(generalLimiter, requireAuth, requireRole("admin"));

// Vendors
router.post("/vendors", validate({ body: createVendorSchema }), vendorController.createVendor);
router.get("/vendors", validate({ query: listVendorsQuerySchema }), vendorController.listVendors);
router.get("/vendors/:vendorId", validate({ params: vendorIdParamsSchema }), vendorController.getVendor);
router.patch(
  "/vendors/:vendorId/status",
  validate({ params: vendorIdParamsSchema, body: setVendorStatusSchema }),
  vendorController.setVendorStatus
);

export default router;
