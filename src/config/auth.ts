// Better Auth setup: sign-up, sign-in, sessions, email verification,
// password reset, Google sign-in and admin tools (incl. impersonation).
// Better Auth serves all of this at /api/auth/* (mounted in app.ts).
//
// Roles:
//   admin  → Vendly team
//   vendor → created by an admin
//   user   → reseller (everyone who signs up publicly)
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
import { fromNodeHeaders } from "better-auth/node";
import { env, features } from "./env.js";
import { authDb, mongoClient } from "../db/mongo.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../lib/email/email.service.js";
import { createResellerProfileForUser, syncResellerProfileFromUser } from "../modules/profiles/profile.service.js";
import { logger } from "../lib/logger.js";

// What each role may do inside Better Auth's admin endpoints.
// Only admins get admin powers (list users, ban, impersonate...).
const ac = createAccessControl({ ...defaultStatements } as const);
const roles = {
  admin: ac.newRole({ ...adminAc.statements }),
  vendor: ac.newRole({}),
  user: ac.newRole({}),
};

export const auth = betterAuth({
  database: mongodbAdapter(authDb, { client: mongoClient }), // client → transactions on
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.CORS_ORIGINS,

  advanced: {
    // Production: share the login cookie between vendly.com and api.vendly.com
    crossSubDomainCookies: {
      enabled: env.isProduction && Boolean(env.COOKIE_DOMAIN),
      domain: env.COOKIE_DOMAIN || undefined,
    },
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"],
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ to: user.email, name: user.name, url });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ to: user.email, name: user.name, url });
    },
  },

  // Google only switches on when both keys are in .env
  socialProviders: features.googleSignIn
    ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
    : {},

  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },

  user: {
    additionalFields: {
      phoneNumber: { type: "string", required: false },
    },
  },

  // Runs after Better Auth writes its own user record
  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          // Only public sign-ups (role "user") are resellers.
          // Vendors and admins get their profiles elsewhere.
          if ((user.role || "user") !== "user") return;
          try {
            await createResellerProfileForUser(user);
          } catch (err: any) {
            // Don't block sign-up; GET /me creates the profile if it's missing
            logger.error("Could not create reseller profile at sign-up", { userId: user.id, message: err.message });
          }
        },
      },
      update: {
        after: async (user: any) => {
          if ((user.role || "user") === "user") await syncResellerProfileFromUser(user);
        },
      },
    },
  },

  plugins: [
    admin({
      ac,
      roles,
      defaultRole: "user",
      adminRoles: ["admin"],
      impersonationSessionDuration: 60 * 60, // 1 hour of "acting as vendor"
    }),
  ],
});

// Reads the session cookie from an Express request. Returns null if not logged in.
export async function getSessionFromRequest(headers: any) {
  return auth.api.getSession({ headers: fromNodeHeaders(headers) });
}
