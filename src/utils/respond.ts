// Every successful response has the same shape:
//   { success: true, data, meta? }
// `meta` is for extras like pagination: { page, limit, total }.
import { Response } from "express";

export function ok(res: Response, data: unknown, meta?: Record<string, unknown>) {
  return res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created(res: Response, data: unknown) {
  return res.status(201).json({ success: true, data });
}
