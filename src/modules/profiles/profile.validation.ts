// Input rules for profile endpoints. Unknown fields are stripped, so a
// reseller can't, for example, send { balances: ... } and change their money.
import { z } from "zod";
import { THEME_PRESETS } from "../../models/index.js";

const payoutDetails = z.object({
  method: z.enum(["momo", "bank"]),
  network: z.string().trim().max(50).optional(),
  accountName: z.string().trim().min(2).max(100),
  accountNumber: z.string().trim().min(6).max(30),
});

export const updateResellerProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phoneNumber: z.string().trim().min(9).max(20).optional(),
  payoutDetails: payoutDetails.optional(),
});

export const updateStoreConfigSchema = z.object({
  branding: z
    .object({
      storeName: z.string().trim().min(2).max(40).optional(),
      tagline: z.string().trim().max(80).optional(),
      themePreset: z.enum(THEME_PRESETS).optional(),
    })
    .optional(),
  contact: z
    .object({
      whatsapp: z.string().trim().max(20).optional(),
      instagram: z.string().trim().max(60).optional(),
      tiktok: z.string().trim().max(60).optional(),
    })
    .optional(),
});

export const updateVendorProfileSchema = z.object({
  description: z.string().trim().max(500).optional(),
  contact: z
    .object({
      phone: z.string().trim().max(20).optional(),
      email: z.email().optional(),
      address: z.string().trim().max(200).optional(),
    })
    .optional(),
  pickupLocation: z
    .object({
      address: z.string().trim().max(200).optional(),
      area: z.string().trim().max(80).optional(),
      city: z.string().trim().max(80).optional(),
    })
    .optional(),
  payoutDetails: payoutDetails.optional(),
});
