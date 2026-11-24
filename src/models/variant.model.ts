// One buyable version of a product: "iPhone 15 · 128GB / Black".
// A product with no options still has exactly one variant ("Default").
//
// Prices (pesewas):
//   vendorPrice: what the vendor receives per unit
//   basePrice:   what resellers see as the base (vendorPrice + Vendly's margin)
// Customer pays max(resellerPrice, basePrice). Reseller profit never goes below 0.
import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "VendorProfile", required: true }, // copied for fast queries

    options: { type: Map, of: String, default: {} }, // { Storage: "128GB", Colour: "Black" }
    label: { type: String, required: true, trim: true }, // "128GB / Black"
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },

    vendorPrice: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, required: true, min: 0 },

    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 }, // held by unpaid orders

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

variantSchema.index({ productId: 1 });
variantSchema.index({ vendorId: 1, isActive: 1 });

// Vendly never sells below what it owes the vendor
variantSchema.pre("validate", function () {
  if (this.basePrice < this.vendorPrice) {
    this.invalidate("basePrice", "basePrice cannot be lower than vendorPrice");
  }
});

export const Variant = mongoose.model("Variant", variantSchema);
