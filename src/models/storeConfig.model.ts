// The reseller's brand. One per reseller, shared by all their stores, so
// "Ama's Gadgets" and "Ama's Fashion" look like one business.
// Created automatically with sensible defaults at sign-up.
import mongoose from "mongoose";

export const THEME_PRESETS = ["emerald", "midnight", "sunset", "ocean", "rose", "gold"] as const;

const storeConfigSchema = new mongoose.Schema(
  {
    resellerId: { type: mongoose.Schema.Types.ObjectId, ref: "ResellerProfile", required: true, unique: true },

    branding: {
      storeName: { type: String, required: true, trim: true }, // "Ama's Picks"
      tagline: { type: String, trim: true, default: "" },
      logoUrl: { type: String, default: "" }, // empty → frontend shows initials
      logoPublicId: { type: String, default: "" },
      themePreset: { type: String, enum: THEME_PRESETS, default: "emerald" },
    },

    // How customers reach the reseller (shown on their stores)
    contact: {
      whatsapp: { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
      tiktok: { type: String, trim: true, default: "" },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const StoreConfig = mongoose.model("StoreConfig", storeConfigSchema);
