// Redis holds fast, temporary things only: store lookup cache, background
// jobs, and one-time locks (e.g. "this Paystack webhook was handled").
// MongoDB is always the source of truth; losing Redis data loses nothing
// important.
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => logger.error("Redis error", { message: err.message }));

export async function connectRedis() {
  await redis.connect();
  logger.info("Redis connected");
}

export async function disconnectRedis() {
  await redis.quit();
}
