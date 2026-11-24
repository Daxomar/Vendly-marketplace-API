// Every API route lives under /api/v1, grouped by WHO is calling.
// Open this file to see the whole API at a glance.
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { generalLimiter } from "../middleware/rateLimiters.js";
import * as profileController from "../modules/profiles/profile.controller.js";
import publicRoutes from "./public.routes.js";
import resellerRoutes from "./reseller.routes.js";
import vendorRoutes from "./vendor.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

// Any logged-in user: who am I, what's my role, what's my profile?
// The frontend calls this after login to decide which dashboard to show.
router.get("/me", generalLimiter, requireAuth, profileController.getMe);

router.use("/reseller", resellerRoutes); // /api/v1/reseller/...
router.use("/vendor", vendorRoutes); //     /api/v1/vendor/...
router.use("/admin", adminRoutes); //       /api/v1/admin/...
router.use("/", publicRoutes); //           /api/v1/categories, later /store/...

export default router;
