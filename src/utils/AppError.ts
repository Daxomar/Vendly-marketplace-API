// The one error type services throw on purpose.
// The error handler turns it into:
//   { success: false, code, message, details }
// The frontend switches on `code` (stable), never on `message` (wording can change).
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Shortcuts for the common cases
export const badRequest = (code: string, message: string, details?: unknown) => new AppError(400, code, message, details);
export const unauthorized = (code = "UNAUTHORIZED", message = "You must be logged in") => new AppError(401, code, message);
export const forbidden = (code: string, message = "You are not allowed to do this") => new AppError(403, code, message);
export const notFound = (code: string, message = "Not found") => new AppError(404, code, message);
export const conflict = (code: string, message: string) => new AppError(409, code, message);
