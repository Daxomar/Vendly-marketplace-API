// A reseller's own price for one variant. Optional: with no record, the
// product sells at basePrice and the reseller earns ₵0 on it.
//
// If the vendor later raises basePrice above this price, the customer pays
// basePrice and the reseller's profit is 0, never negative.
import mongoose from "mongoose";

const resellerPriceSchema = new mongoose.Schema(
  {
    resellerId: { type: mongoose.Schema.Types.ObjectId, ref: "ResellerProfile", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "VendorProfile", required: true }, // copied for fast queries
    price: { type: Number, required: true, min: 0 }, // pesewas
  },
  { timestamps: true }
);

resellerPriceSchema.index({ resellerId: 1, variantId: 1 }, { unique: true });
resellerPriceSchema.index({ resellerId: 1, vendorId: 1 });

export const ResellerPrice = mongoose.model("ResellerPrice", resellerPriceSchema);
