// The one place that turns errors into JSON responses. Must be the LAST
// app.use() in app.ts. Express 5 sends errors thrown in async handlers here
// automatically, so controllers never need try/catch.
//
// Every error response looks like:
//   { success: false, code, message, details?, requestId? }
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // 1. Errors we threw on purpose (AppError, badRequest(), notFound()...)
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }

  // 2. Bad input caught by validate()
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details: err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    });
  }

  // 3. Mongoose schema rules (required, min, enum...)
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Invalid data",
      details: Object.values(err.errors).map((e: any) => ({ field: e.path, message: e.message })),
    });
  }

  // 4. Malformed id in the URL, e.g. /vendors/not-an-id
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ success: false, code: "INVALID_ID", message: `Invalid ${err.path}` });
  }

  // 5. MongoDB unique index hit (e.g. that email/slug already exists)
  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      code: "DUPLICATE",
      message: "That already exists",
      details: { fields: Object.keys(err.keyValue ?? {}) },
    });
  }

  // 6. Errors from Better Auth calls made inside our services
  //    (e.g. auth.api.createUser with an email that's already registered)
  if (err?.name === "APIError" && err?.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.body?.code || "AUTH_ERROR",
      message: err.body?.message || err.message,
    });
  }

  // 7. Broken JSON body
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, code: "INVALID_JSON", message: "Request body is not valid JSON" });
  }

  // 8. Anything else is a bug: log everything, reveal nothing internal
  logger.error("Unhandled error", {
    requestId: req.id,
    method: req.method,
    path: req.path,
    message: err?.message,
    stack: err?.stack,
  });
  return res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: env.isProduction ? "Something went wrong" : err?.message || "Something went wrong",
    requestId: req.id,
  });
}
