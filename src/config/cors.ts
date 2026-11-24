// Which websites may call the API from a browser (with cookies).
// Set FRONTEND_URL and, if needed, CORS_ORIGINS in .env.
import { CorsOptions } from "cors";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // No origin = Postman, Thunder Client, server-to-server, mobile apps
    if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
    logger.warn("CORS blocked origin", { origin });
    callback(null, false);
  },
  credentials: true, // allow the login cookie
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};
