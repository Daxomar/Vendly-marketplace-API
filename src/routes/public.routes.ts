// PUBLIC: no login needed. Store browsing, vendor directory and checkout
// arrive here in later stages.
import { Router } from "express";
import { lenientLimiter } from "../middleware/rateLimiters.js";
import * as categoryController from "../modules/catalog/category.controller.js";

const router = Router();

router.use(lenientLimiter);

router.get("/categories", categoryController.listCategories);

export default router;
