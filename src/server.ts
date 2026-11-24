// Entry point: connect to MongoDB and Redis, then start listening.
import app from "./app.js";
import { env, features } from "./config/env.js";
import { connectMongo, disconnectMongo } from "./db/mongo.js";
import { connectRedis, disconnectRedis } from "./db/redis.js";
import { logger } from "./lib/logger.js";

async function start() {
  await connectMongo();
  await connectRedis();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Vendly API on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    logger.info(
      `Features → Google sign-in: ${on(features.googleSignIn)} · email: ${on(features.email)} · uploads: ${on(features.cloudinary)}`
    );
  });

  // Close connections cleanly on Ctrl+C / container stop
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close();
    await Promise.allSettled([disconnectMongo(), disconnectRedis()]);
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

const on = (flag: boolean) => (flag ? "on" : "off (not set in .env)");

start().catch((err) => {
  logger.error("Failed to start", { message: err.message });
  process.exit(1);
});
