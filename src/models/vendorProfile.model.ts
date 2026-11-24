// A vendor's business record. Created by an admin (while Vendly manages
// vendor accounts) via POST /api/v1/admin/vendors.
import mongoose from "mongoose";

const vendorProfileSchema = new mongoose.Schema(
  {
    // Link to the Better Auth user (role "vendor")
    userId: { type: String, required: true, unique: true },

    businessName: { type: String, required: true, trim: true },
    // Readable id for the vendor directory: /vendors/techhub
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Used in join links: /join/TECHHUB. Generated when approved.
    vendorCode: { type: String, unique: true, sparse: true, trim: true, uppercase: true },

    status: { type: String, enum: ["pending", "approved", "suspended"], default: "pending" },

    description: { type: String, trim: true, default: "" },
    logoUrl: { type: String, default: "" },
    logoPublicId: { type: String, default: "" }, // Cloudinary id, for deleting/replacing

    contact: {
      phone: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      address: { type: String, trim: true, default: "" },
    },

    // Where riders collect orders from
    pickupLocation: {
      address: { type: String, trim: true, default: "" },
      area: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
    },

    // Main categories this vendor sells in (for the directory and default store names)
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    payoutDetails: {
      type: new mongoose.Schema(
        {
          method: { type: String, enum: ["momo", "bank"], required: true },
          network: { type: String, trim: true },
          accountName: { type: String, trim: true, required: true },
          accountNumber: { type: String, trim: true, required: true },
        },
        { _id: false }
      ),
      default: null,
    },

    // true while the Vendly team runs this vendor's account
    managedByAdmin: { type: Boolean, default: true },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

vendorProfileSchema.index({ status: 1 });

export const VendorProfile = mongoose.model("VendorProfile", vendorProfileSchema);
