// Profiles: the business side of an account.
//  - Resellers get a ResellerProfile + StoreConfig automatically at sign-up.
//  - Vendors get a VendorProfile when an admin creates them (see modules/vendors).
import { ResellerProfile, VendorProfile, StoreConfig } from "../../models/index.js";
import { generateResellerCode } from "../../utils/codes.js";
import { notFound } from "../../utils/AppError.js";

type AuthUser = { id: string; name: string; email: string; phoneNumber?: string | null };

// Default store name from a person's name: "Ama Mensah" → "Ama's Picks"
function defaultStoreName(name: string) {
  const first = (name || "My").trim().split(/\s+/)[0];
  return `${first}'s Picks`;
}

// Creates the reseller profile + default store branding for a new user.
// Safe to call twice: returns the existing profile if there is one.
export async function createResellerProfileForUser(user: AuthUser) {
  const existing = await ResellerProfile.findOne({ userId: user.id });
  if (existing) return existing;

  const resellerCode = await generateResellerCode(user.name, async (code) =>
    Boolean(await ResellerProfile.exists({ resellerCode: code }))
  );

  const profile = await ResellerProfile.create({
    userId: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber || "",
    resellerCode,
  });

  await StoreConfig.create({
    resellerId: profile._id,
    branding: { storeName: defaultStoreName(user.name) },
  });

  return profile;
}

// Keeps copied fields in sync when the user changes their name or email
export async function syncResellerProfileFromUser(user: AuthUser) {
  await ResellerProfile.updateOne({ userId: user.id }, { name: user.name, email: user.email });
}

// GET /me: who is logged in, their role and their business profile
export async function getMe(user: Express.Request["user"]) {
  let profile: any = null;

  if (user.role === "user") {
    // Self-heal: if sign-up's profile step ever failed, create it now
    profile = await createResellerProfileForUser(user);
  } else if (user.role === "vendor") {
    profile = await VendorProfile.findOne({ userId: user.id });
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    role: user.role === "user" ? "reseller" : user.role, // friendlier for the frontend
    profile,
    impersonatedBy: user.impersonatedBy || null,
  };
}

// ── Reseller ───────────────────────────────────────────────

export async function updateResellerProfile(resellerId: string, input: any) {
  const profile = await ResellerProfile.findByIdAndUpdate(resellerId, { $set: input }, { returnDocument: "after", runValidators: true });
  if (!profile) throw notFound("PROFILE_NOT_FOUND", "Reseller profile not found");
  return profile;
}

export async function getStoreConfig(resellerId: string) {
  const config = await StoreConfig.findOne({ resellerId });
  if (!config) throw notFound("STORE_CONFIG_NOT_FOUND", "Store settings not found");
  return config;
}

// input looks like { branding: { storeName }, contact: { whatsapp } }.
// Only the fields sent are changed ("branding.storeName"), the rest are kept.
export async function updateStoreConfig(resellerId: string, input: any) {
  const set: Record<string, unknown> = {};
  for (const section of ["branding", "contact"]) {
    for (const [key, value] of Object.entries(input[section] || {})) {
      set[`${section}.${key}`] = value;
    }
  }
  const config = await StoreConfig.findOneAndUpdate({ resellerId }, { $set: set }, { returnDocument: "after", runValidators: true });
  if (!config) throw notFound("STORE_CONFIG_NOT_FOUND", "Store settings not found");
  return config;
}

// ── Vendor ─────────────────────────────────────────────────

export async function updateVendorProfile(vendorId: string, input: any) {
  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    // Nested sections are merged field by field, like updateStoreConfig
    if (value && typeof value === "object" && !Array.isArray(value) && key !== "payoutDetails") {
      for (const [inner, innerValue] of Object.entries(value)) set[`${key}.${inner}`] = innerValue;
    } else {
      set[key] = value;
    }
  }
  const profile = await VendorProfile.findByIdAndUpdate(vendorId, { $set: set }, { returnDocument: "after", runValidators: true });
  if (!profile) throw notFound("VENDOR_NOT_FOUND", "Vendor profile not found");
  return profile;
}
