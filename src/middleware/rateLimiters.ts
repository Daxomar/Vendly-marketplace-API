// Limits how often the same caller can hit a route.
// Counts are kept in memory (fine for one server). When running several
// servers, switch these to a Redis store so they share counts.
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";

const limitMessage = (message: string) => ({ success: false, code: "RATE_LIMITED", message });

// Sensitive actions: checkout, payout requests. Keyed by user when logged in.
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many attempts, please try again later."),
  keyGenerator: (req: Request) => req.user?.id || ipKeyGenerator(req.ip ?? ""),
});

// Most routes
export const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many requests, please try again later."),
});

// Public browsing (stores, products)
export const lenientLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many requests, please slow down."),
});
