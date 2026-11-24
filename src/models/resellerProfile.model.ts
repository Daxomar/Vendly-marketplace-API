// A reseller's business record. Created automatically when someone signs up
// (Better Auth hook in config/auth.ts). Better Auth owns login; this owns
// everything business: code, balances, payout details.
import mongoose from "mongoose";

const payoutDetailsSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ["momo", "bank"], required: true },
    network: { type: String, trim: true }, // MoMo network or bank name
    accountName: { type: String, trim: true, required: true },
    accountNumber: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const resellerProfileSchema = new mongoose.Schema(
  {
    // Link to the Better Auth user (Better Auth ids are strings)
    userId: { type: String, required: true, unique: true },

    // Copied from the user so lists don't need a second lookup
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, trim: true },

    // Public code used in store links: /s/AMA42/gadgets
    resellerCode: { type: String, required: true, unique: true, trim: true, uppercase: true },

    status: { type: String, enum: ["active", "suspended"], default: "active" },

    // Running totals in pesewas. Only commission/payout services change these.
    balances: {
      pending: { type: Number, default: 0 }, // earned, still in the holding period
      available: { type: Number, default: 0 }, // can be withdrawn
      paidOut: { type: Number, default: 0 },
    },
    totalSales: { type: Number, default: 0 }, // number of completed order items

    payoutDetails: { type: payoutDetailsSchema, default: null },
  },
  { timestamps: true }
);

resellerProfileSchema.index({ status: 1 });

export const ResellerProfile = mongoose.model("ResellerProfile", resellerProfileSchema);
