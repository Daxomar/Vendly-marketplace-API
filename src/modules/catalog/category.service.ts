// Categories are shared by all vendors. Read publicly; managed by admin
// (admin create/edit endpoints arrive with the catalogue stage).
import { Category } from "../../models/index.js";

// Active categories, parents first, in display order
export async function listCategories() {
  return Category.find({ isActive: true }).sort({ parentId: 1, sortOrder: 1, name: 1 }).lean();
}
