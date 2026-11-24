import { Request, Response } from "express";
import * as categoryService from "./category.service.js";
import { ok } from "../../utils/respond.js";

// GET /api/v1/categories
export async function listCategories(_req: Request, res: Response) {
  ok(res, await categoryService.listCategories());
}
