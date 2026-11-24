// A product belongs to ONE vendor. What a customer actually buys is a
// Variant (e.g. "128GB / Black"); prices and stock live on the variant.
import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" }, // Cloudinary id ("" for external/seed images)
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "VendorProfile", required: true },

    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true }, // unique per vendor
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    images: { type: [imageSchema], default: [] },

    // Filled from the category's attributeTemplate, e.g. { screen: "6.1in" }
    attributes: { type: Map, of: String, default: {} },

    // The choices customers pick from, e.g. [{ name: "Storage", values: ["128GB", "256GB"] }]
    variantOptions: {
      type: [{ name: { type: String, required: true }, values: [{ type: String }], _id: false }],
      default: [],
    },

    status: { type: String, enum: ["draft", "active", "archived"], default: "active" },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ vendorId: 1, slug: 1 }, { unique: true });
productSchema.index({ vendorId: 1, status: 1, categoryId: 1 });
productSchema.index({ title: "text", brand: "text" });

export const Product = mongoose.model("Product", productSchema);
