// VENDOR routes, mounted at /api/v1/vendor.
// Every route: logged in → role "vendor" → approved vendor loaded (req.vendor).
// While Vendly manages vendors, admins reach these by impersonating the vendor.
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { loadVendor } from "../middleware/loadVendor.js";
import { generalLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import * as profileController from "../modules/profiles/profile.controller.js";
import { updateVendorProfileSchema } from "../modules/profiles/profile.validation.js";

const router = Router();

router.use(generalLimiter, requireAuth, requireRole("vendor"), loadVendor);

router.get("/profile", profileController.getVendorProfile);
router.patch("/profile", validate({ body: updateVendorProfileSchema }), profileController.updateVendorProfile);

export default router;
