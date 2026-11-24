// Reads .env once and exposes typed settings to the rest of the app.
// If a REQUIRED value is missing, the API stops at startup with a clear
// message instead of failing later in a confusing way.
import { config } from "dotenv";

config({ quiet: true });

const required = ["MONGODB_URI", "REDIS_URL", "BETTER_AUTH_SECRET"] as const;

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`\n❌ Missing ${missing.join(", ")} in .env (see .env.example)\n`);
  process.exit(1);
}

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && value !== "" && value !== undefined ? n : fallback;
};

const list = (value: string | undefined) =>
  (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const env = {
  NODE_ENV,
  isProduction: NODE_ENV === "production",
  PORT: num(process.env.PORT, 5000),
  FRONTEND_URL,
  CORS_ORIGINS: [FRONTEND_URL, ...list(process.env.CORS_ORIGINS)],

  MONGODB_URI: process.env.MONGODB_URI as string,
  REDIS_URL: process.env.REDIS_URL as string,

  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || "",

  // Business settings. Money is always in pesewas (₵1.00 = 100).
  STOCK_RESERVATION_MINUTES: num(process.env.STOCK_RESERVATION_MINUTES, 30),
  COMMISSION_HOLD_HOURS: num(process.env.COMMISSION_HOLD_HOURS, 24),
  WITHDRAWAL_FEE_PESEWAS: num(process.env.WITHDRAWAL_FEE_PESEWAS, 0),
  MIN_WITHDRAWAL_PESEWAS: num(process.env.MIN_WITHDRAWAL_PESEWAS, 0),

  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || "admin@vendly.local",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!",
  SEED_USER_PASSWORD: process.env.SEED_USER_PASSWORD || "Password123!",
};

// Feature flags derived from which keys are filled in
export const features = {
  googleSignIn: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  email: Boolean(env.SENDGRID_API_KEY && env.EMAIL_FROM),
  cloudinary: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
};
