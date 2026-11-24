// Admin side of vendors: create vendor accounts, list them, approve/suspend.
// (The vendor's own side, like editing their profile, is in modules/profiles.)
import { auth } from "../../config/auth.js";
import { VendorProfile, Category } from "../../models/index.js";
import { generateVendorCode } from "../../utils/codes.js";
import { uniqueSlug } from "../../utils/slug.js";
import { badRequest, notFound } from "../../utils/AppError.js";
import { logger } from "../../lib/logger.js";

type CreateVendorInput = {
  ownerName: string;
  email: string;
  password?: string;
  businessName: string;
  description?: string;
  phone?: string;
  categoryIds?: string[];
  pickupLocation?: { address?: string; area?: string; city?: string };
  approve: boolean;
};

const vendorCodeTaken = async (code: string) => Boolean(await VendorProfile.exists({ vendorCode: code }));

export async function createVendor(input: CreateVendorInput) {
  if (input.categoryIds?.length) {
    const found = await Category.countDocuments({ _id: { $in: input.categoryIds } });
    if (found !== input.categoryIds.length) throw badRequest("INVALID_CATEGORY", "One or more categories don't exist");
  }

  // 1. The login account (Better Auth). Called from the server, so no
  //    session is needed; our route already checked the caller is an admin.
  //    Email is marked verified because Vendly created it.
  const { user } = await auth.api.createUser({
    body: {
      name: input.ownerName,
      email: input.email,
      password: input.password, // undefined → no password; admin acts via impersonation
      role: "vendor",
      data: { emailVerified: true, phoneNumber: input.phone || "" },
    },
  });

  // 2. The business profile. If this fails, remove the login so the email
  //    can be used again.
  try {
    const slug = await uniqueSlug(input.businessName, async (s) => Boolean(await VendorProfile.exists({ slug: s })));
    const approved = input.approve;

    return await VendorProfile.create({
      userId: user.id,
      businessName: input.businessName,
      slug,
      vendorCode: approved ? await generateVendorCode(input.businessName, vendorCodeTaken) : undefined,
      status: approved ? "approved" : "pending",
      approvedAt: approved ? new Date() : null,
      description: input.description || "",
      contact: { phone: input.phone || "", email: input.email },
      pickupLocation: input.pickupLocation || {},
      categoryIds: input.categoryIds || [],
      managedByAdmin: true,
    });
  } catch (err) {
    logger.error("Vendor profile failed; removing the login that was just created", { email: input.email });
    await auth.api.removeUser({ body: { userId: user.id } }).catch(() => {});
    throw err;
  }
}

export async function listVendors(query: { status?: string; search?: string; page: number; limit: number }) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.businessName = { $regex: escapeRegex(query.search), $options: "i" };

  const [items, total] = await Promise.all([
    VendorProfile.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate("categoryIds", "name slug"),
    VendorProfile.countDocuments(filter),
  ]);

  return { items, meta: { page: query.page, limit: query.limit, total } };
}

export async function getVendor(vendorId: string) {
  const vendor = await VendorProfile.findById(vendorId).populate("categoryIds", "name slug");
  if (!vendor) throw notFound("VENDOR_NOT_FOUND", "Vendor not found");
  return vendor;
}

// Approving for the first time generates the vendorCode used in join links
export async function setVendorStatus(vendorId: string, status: "approved" | "suspended" | "pending") {
  const vendor = await VendorProfile.findById(vendorId);
  if (!vendor) throw notFound("VENDOR_NOT_FOUND", "Vendor not found");

  vendor.status = status;
  if (status === "approved") {
    if (!vendor.vendorCode) vendor.vendorCode = await generateVendorCode(vendor.businessName, vendorCodeTaken);
    if (!vendor.approvedAt) vendor.approvedAt = new Date();
  }
  await vendor.save();

  // Stage 2: clear cached store lookups here, so a suspended vendor's
  // products disappear from resellers' stores immediately.
  return vendor;
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
