// Two connections to the same MongoDB database:
//  - mongoose: used by our own models (profiles, products, orders...)
//  - mongoClient: the raw driver client Better Auth needs for its own
//    collections (user, session, account, verification)
import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export const mongoClient = new MongoClient(env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // fail after 5s instead of hanging forever
});

// The database name comes from the connection string (".../vendly?...").
// The driver connects lazily, so Better Auth can be configured with this
// before connectMongo() runs.
export const authDb = mongoClient.db();

export async function connectMongo() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await mongoClient.connect();
  logger.info(`MongoDB connected (${mongoose.connection.name})`);
}

export async function disconnectMongo() {
  await mongoose.disconnect();
  await mongoClient.close();
}
