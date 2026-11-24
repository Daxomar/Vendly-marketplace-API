// RESELLER routes, mounted at /api/v1/reseller.
// The guard chain is applied ONCE below, so every route in this file is
// automatically: logged in → role "user" (reseller) → req.reseller loaded.
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { loadReseller } from "../middleware/loadReseller.js";
import { generalLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import * as profileController from "../modules/profiles/profile.controller.js";
import { updateResellerProfileSchema, updateStoreConfigSchema } from "../modules/profiles/profile.validation.js";

const router = Router();

router.use(generalLimiter, requireAuth, requireRole("user"), loadReseller);

// Profile
router.get("/profile", profileController.getResellerProfile);
router.patch("/profile", validate({ body: updateResellerProfileSchema }), profileController.updateResellerProfile);

// Store branding (shared by all the reseller's stores)
router.get("/store-config", profileController.getStoreConfig);
router.patch("/store-config", validate({ body: updateStoreConfigSchema }), profileController.updateStoreConfig);

export default router;
