// npm run seed
// WIPES the local database and fills it with test data:
//   1 admin · 4 categories · 2 vendors with products · 2 resellers
// Safe to run again whenever things get messy. Refuses to run in production.
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { auth } from "../config/auth.js";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import {
  Category,
  Product,
  Variant,
  ResellerProfile,
  VendorMembership,
  ResellerPrice,
  StoreConfig,
  VendorProfile,
} from "../models/index.js";
import * as vendorService from "../modules/vendors/vendor.service.js";
import { slugify } from "../utils/slug.js";
import { cedisToPesewas } from "../utils/money.js";

if (env.isProduction) {
  console.error("❌ Refusing to seed: NODE_ENV is production");
  process.exit(1);
}

const PASSWORD = env.SEED_USER_PASSWORD;
const img = (text: string) => ({ url: `https://placehold.co/600x600/png?text=${encodeURIComponent(text)}`, publicId: "" });

// ── Helpers ────────────────────────────────────────────────

async function wipeDatabase() {
  await mongoose.connection.dropDatabase();
  // Recreate our indexes (unique rules etc.) on the empty database
  for (const model of Object.values(mongoose.models)) await model.syncIndexes();
}

async function createAuthUser(name: string, email: string, password: string, role: "admin" | "user") {
  const { user } = await auth.api.createUser({
    body: { name, email, password, role, data: { emailVerified: true } },
  });
  return user;
}

type SeedVariant = { options?: Record<string, string>; vendorPrice: number; basePrice: number; stock: number };
type SeedProduct = {
  title: string;
  category: string; // category slug
  brand?: string;
  description: string;
  variantOptions?: { name: string; values: string[] }[];
  attributes?: Record<string, string>;
  variants: SeedVariant[]; // prices in cedis here, stored as pesewas
};

async function addProduct(vendor: any, p: SeedProduct, categories: Record<string, any>) {
  const product = await Product.create({
    vendorId: vendor._id,
    title: p.title,
    slug: slugify(p.title),
    categoryId: categories[p.category]._id,
    brand: p.brand || "",
    description: p.description,
    images: [img(p.title)],
    attributes: p.attributes || {},
    variantOptions: p.variantOptions || [],
    status: "active",
  });

  const variants = [];
  for (const [i, v] of p.variants.entries()) {
    const options = v.options || {};
    const label = Object.values(options).join(" / ") || "Default";
    variants.push(
      await Variant.create({
        productId: product._id,
        vendorId: vendor._id,
        options,
        label,
        sku: `${vendor.vendorCode}-${slugify(p.title).slice(0, 12)}-${i + 1}`.toUpperCase(),
        vendorPrice: cedisToPesewas(v.vendorPrice),
        basePrice: cedisToPesewas(v.basePrice),
        stock: v.stock,
      })
    );
  }
  return { product, variants };
}

// ── Data ───────────────────────────────────────────────────

const categoryData = [
  {
    name: "Phones & Accessories",
    slug: "phones-accessories",
    sortOrder: 1,
    attributeTemplate: [
      { key: "storage", label: "Storage", type: "select", options: ["64GB", "128GB", "256GB", "512GB"] },
      { key: "ram", label: "RAM", type: "text" },
      { key: "condition", label: "Condition", type: "select", options: ["Brand new", "UK used"], required: true },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    sortOrder: 2,
    attributeTemplate: [
      { key: "material", label: "Material", type: "text" },
      { key: "fit", label: "Fit", type: "select", options: ["Slim", "Regular", "Loose"] },
    ],
  },
  {
    name: "Beauty",
    slug: "beauty",
    sortOrder: 3,
    attributeTemplate: [{ key: "skinType", label: "Skin type", type: "select", options: ["All", "Dry", "Oily", "Combination"] }],
  },
  {
    name: "Food & Snacks",
    slug: "food-snacks",
    sortOrder: 4,
    attributeTemplate: [{ key: "weight", label: "Weight / size", type: "text", required: true }],
  },
];

const techHubProducts: SeedProduct[] = [
  {
    title: "iPhone 15",
    category: "phones-accessories",
    brand: "Apple",
    description: "6.1-inch display, A16 chip, 48MP camera. Brand new, sealed.",
    attributes: { condition: "Brand new", ram: "6GB" },
    variantOptions: [
      { name: "Storage", values: ["128GB", "256GB"] },
      { name: "Colour", values: ["Black", "Blue"] },
    ],
    variants: [
      { options: { Storage: "128GB", Colour: "Black" }, vendorPrice: 9000, basePrice: 9500, stock: 5 },
      { options: { Storage: "128GB", Colour: "Blue" }, vendorPrice: 9000, basePrice: 9500, stock: 3 },
      { options: { Storage: "256GB", Colour: "Black" }, vendorPrice: 10500, basePrice: 11000, stock: 2 },
    ],
  },
  {
    title: "Samsung Galaxy A15",
    category: "phones-accessories",
    brand: "Samsung",
    description: "6.5-inch AMOLED, 5000mAh battery, dual SIM.",
    attributes: { condition: "Brand new", ram: "4GB", storage: "128GB" },
    variants: [{ vendorPrice: 2100, basePrice: 2300, stock: 10 }],
  },
  {
    title: "Wireless Earbuds Pro",
    category: "phones-accessories",
    brand: "Oraimo",
    description: "Noise cancelling, 30-hour battery with case, fast charging.",
    variants: [{ vendorPrice: 250, basePrice: 280, stock: 25 }],
  },
  {
    title: "Power Bank 20000mAh",
    category: "phones-accessories",
    brand: "Anker",
    description: "Charges two phones at once. Fast charging, LED battery display.",
    variants: [{ vendorPrice: 300, basePrice: 330, stock: 15 }],
  },
  {
    title: "USB-C Fast Charger 25W",
    category: "phones-accessories",
    brand: "Samsung",
    description: "Original 25W adapter with USB-C cable.",
    variants: [{ vendorPrice: 120, basePrice: 140, stock: 40 }],
  },
  {
    title: "Clear Phone Case",
    category: "phones-accessories",
    description: "Shockproof transparent case. Tell us your phone model at checkout.",
    variantOptions: [{ name: "Colour", values: ["Clear", "Black"] }],
    variants: [
      { options: { Colour: "Clear" }, vendorPrice: 35, basePrice: 40, stock: 60 },
      { options: { Colour: "Black" }, vendorPrice: 35, basePrice: 40, stock: 0 }, // out of stock on purpose
    ],
  },
];

const styleCoProducts: SeedProduct[] = [
  {
    title: "Ankara Wrap Dress",
    category: "fashion",
    description: "Hand-finished wrap dress in bold Ankara print. Flattering on every shape.",
    attributes: { material: "100% cotton", fit: "Regular" },
    variantOptions: [{ name: "Size", values: ["S", "M", "L"] }],
    variants: [
      { options: { Size: "S" }, vendorPrice: 220, basePrice: 250, stock: 6 },
      { options: { Size: "M" }, vendorPrice: 220, basePrice: 250, stock: 8 },
      { options: { Size: "L" }, vendorPrice: 220, basePrice: 250, stock: 4 },
    ],
  },
  {
    title: "Men's Kaftan Set",
    category: "fashion",
    description: "Two-piece kaftan with embroidered neckline. Perfect for Fridays and occasions.",
    attributes: { material: "Linen blend", fit: "Loose" },
    variantOptions: [{ name: "Size", values: ["M", "L", "XL"] }],
    variants: [
      { options: { Size: "M" }, vendorPrice: 350, basePrice: 390, stock: 5 },
      { options: { Size: "L" }, vendorPrice: 350, basePrice: 390, stock: 5 },
      { options: { Size: "XL" }, vendorPrice: 350, basePrice: 390, stock: 3 },
    ],
  },
  {
    title: "White Canvas Sneakers",
    category: "fashion",
    description: "Everyday low-top sneakers. Easy to clean.",
    variantOptions: [{ name: "Size", values: ["40", "41", "42", "43"] }],
    variants: [
      { options: { Size: "40" }, vendorPrice: 180, basePrice: 200, stock: 4 },
      { options: { Size: "41" }, vendorPrice: 180, basePrice: 200, stock: 6 },
      { options: { Size: "42" }, vendorPrice: 180, basePrice: 200, stock: 6 },
      { options: { Size: "43" }, vendorPrice: 180, basePrice: 200, stock: 2 },
    ],
  },
  {
    title: "Kente Tote Bag",
    category: "fashion",
    description: "Roomy tote with kente panel and inner zip pocket.",
    variants: [{ vendorPrice: 120, basePrice: 140, stock: 12 }],
  },
  {
    title: "Ribbed Crop Top",
    category: "fashion",
    description: "Soft stretch rib, pairs with everything.",
    variantOptions: [{ name: "Colour", values: ["Black", "Brown"] }],
    variants: [
      { options: { Colour: "Black" }, vendorPrice: 60, basePrice: 70, stock: 20 },
      { options: { Colour: "Brown" }, vendorPrice: 60, basePrice: 70, stock: 15 },
    ],
  },
  {
    title: "Embroidered Bucket Hat",
    category: "fashion",
    description: "One size, adjustable inner band.",
    variants: [{ vendorPrice: 70, basePrice: 80, stock: 10 }],
  },
];

// ── Run ────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Vendly (this wipes the local database)...");
  await connectMongo();
  await wipeDatabase();

  // Admin
  await createAuthUser("Vendly Admin", env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD, "admin");

  // Categories
  const categories: Record<string, any> = {};
  for (const c of categoryData) categories[c.slug] = await Category.create(c);

  // Vendors (same code path as POST /api/v1/admin/vendors)
  const techHub = await vendorService.createVendor({
    ownerName: "Kwame Asante",
    email: "techhub@vendly.local",
    password: PASSWORD,
    businessName: "TechHub",
    description: "Phones, accessories and gadgets. Brand new and UK used.",
    phone: "0201112222",
    categoryIds: [categories["phones-accessories"]._id.toString()],
    pickupLocation: { address: "12 Oxford Street", area: "Osu", city: "Accra" },
    approve: true,
  });
  const styleCo = await vendorService.createVendor({
    ownerName: "Abena Darko",
    email: "styleco@vendly.local",
    password: PASSWORD,
    businessName: "StyleCo",
    description: "Ankara, kaftans and everyday fashion made in Ghana.",
    phone: "0203334444",
    categoryIds: [categories["fashion"]._id.toString()],
    pickupLocation: { address: "Makola Market, Stall 45", area: "Makola", city: "Accra" },
    approve: true,
  });

  const techItems = [];
  for (const p of techHubProducts) techItems.push(await addProduct(techHub, p, categories));
  for (const p of styleCoProducts) await addProduct(styleCo, p, categories);

  // Resellers (the sign-up hook creates their profile + store automatically)
  const amaUser = await createAuthUser("Ama Mensah", "ama@vendly.local", PASSWORD, "user");
  const kofiUser = await createAuthUser("Kofi Boateng", "kofi@vendly.local", PASSWORD, "user");

  // Fixed, memorable codes so links in the docs work
  const ama = await ResellerProfile.findOneAndUpdate({ userId: amaUser.id }, { resellerCode: "AMA42" }, { returnDocument: "after" });
  await ResellerProfile.updateOne({ userId: kofiUser.id }, { resellerCode: "KOFI7" });
  await StoreConfig.updateOne(
    { resellerId: ama._id },
    { "branding.tagline": "Gadgets and fits for campus 🔥", "contact.whatsapp": "0245556666" }
  );

  // Ama has joined both vendors; Kofi has joined none (to test joining)
  await VendorMembership.create([
    { resellerId: ama._id, vendorId: techHub._id, storeSlug: "gadgets", storeTitle: "Ama's Gadgets", joinedVia: "code" },
    { resellerId: ama._id, vendorId: styleCo._id, storeSlug: "fashion", storeTitle: "Ama's Fashion", joinedVia: "directory" },
  ]);

  // Ama has set her own prices on a few TechHub items (the rest sell at base price)
  const [iphone, , earbuds, powerBank] = techItems;
  const amaPrices = [
    { variant: iphone.variants[0], price: 9900 }, // iPhone 128GB Black: base 9,500 → +₵400
    { variant: earbuds.variants[0], price: 330 }, // base 280 → +₵50
    { variant: powerBank.variants[0], price: 380 }, // base 330 → +₵50
  ];
  for (const { variant, price } of amaPrices) {
    await ResellerPrice.create({
      resellerId: ama._id,
      variantId: variant._id,
      vendorId: techHub._id,
      price: cedisToPesewas(price),
    });
  }

  // ── Summary ──
  const [productCount, variantCount, vendors] = await Promise.all([
    Product.countDocuments(),
    Variant.countDocuments(),
    VendorProfile.find().select("businessName vendorCode"),
  ]);

  console.log("\n✅ Done\n");
  console.log(`Categories: ${Object.keys(categories).length} · Products: ${productCount} · Variants: ${variantCount}`);
  console.log(`Ama has set her own price on ${amaPrices.length} TechHub items (the rest sell at base price)\n`);
  console.log("Logins (all emails are pre-verified):");
  console.table([
    { role: "admin", email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD, notes: "" },
    { role: "vendor", email: "techhub@vendly.local", password: PASSWORD, notes: `TechHub · join code ${vendors[0].vendorCode}` },
    { role: "vendor", email: "styleco@vendly.local", password: PASSWORD, notes: `StyleCo · join code ${vendors[1].vendorCode}` },
    { role: "reseller", email: "ama@vendly.local", password: PASSWORD, notes: "AMA42 · stores: /s/AMA42/gadgets, /s/AMA42/fashion" },
    { role: "reseller", email: "kofi@vendly.local", password: PASSWORD, notes: "KOFI7 · no vendors yet" },
  ]);
  console.log("Store pages arrive in Stage 2. For now, sign in and try GET /api/v1/me.\n");

  await disconnectMongo();
}

main().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await disconnectMongo().catch(() => {});
  process.exit(1);
});
