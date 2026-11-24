// The link between ONE reseller and ONE vendor. Neither profile stores the
// other: this document is the only place the relationship lives.
//
// Each membership is also one of the reseller's stores:
//   vendly.com/s/{resellerCode}/{storeSlug}  e.g. /s/AMA42/gadgets
// The vendor's name never appears in the link, so customers only see the
// reseller's brand.
import mongoose from "mongoose";

const vendorMembershipSchema = new mongoose.Schema(
  {
    resellerId: { type: mongoose.Schema.Types.ObjectId, ref: "ResellerProfile", required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "VendorProfile", required: true },

    // Resellers are auto-approved for now. "left" keeps history if they rejoin.
    status: { type: String, enum: ["pending", "approved", "left", "blocked"], default: "approved" },
    joinedVia: { type: String, enum: ["code", "directory", "admin"], default: "directory" },
    joinedAt: { type: Date, default: Date.now },

    // The store this membership creates, e.g. "gadgets" → "Ama's Gadgets"
    storeSlug: { type: String, required: true, trim: true, lowercase: true },
    storeTitle: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// One membership per reseller per vendor
vendorMembershipSchema.index({ resellerId: 1, vendorId: 1 }, { unique: true });
// Store links must be unique per reseller (/s/AMA42/gadgets)
vendorMembershipSchema.index({ resellerId: 1, storeSlug: 1 }, { unique: true });
// "My vendors" and "my resellers" lists
vendorMembershipSchema.index({ resellerId: 1, status: 1 });
vendorMembershipSchema.index({ vendorId: 1, status: 1 });

export const VendorMembership = mongoose.model("VendorMembership", vendorMembershipSchema);
