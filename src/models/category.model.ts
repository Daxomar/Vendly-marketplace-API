// Platform-wide categories (managed by admin), shared by all vendors so the
// directory and store filters are consistent. Can be nested:
// Electronics → Phones.
import mongoose from "mongoose";

// Which product details a category expects, e.g. Phones: storage, RAM.
// The vendor's "new product" form is built from this.
const attributeFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true }, // "storage"
    label: { type: String, required: true, trim: true }, // "Storage"
    type: { type: String, enum: ["text", "number", "select"], default: "text" },
    options: [{ type: String, trim: true }], // for "select"
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    attributeTemplate: { type: [attributeFieldSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1, sortOrder: 1 });

export const Category = mongoose.model("Category", categorySchema);
