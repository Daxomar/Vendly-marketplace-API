// Any route nobody handled → clean JSON 404 (instead of Express's HTML page)
import { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    code: "ROUTE_NOT_FOUND",
    message: `${req.method} ${req.path} not found`,
  });
}
