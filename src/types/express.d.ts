// Extra things our middleware attaches to `req`.
import "express";

declare global {
  namespace Express {
    interface Request {
      // Set by requestId middleware on every request
      id?: string;

      // Set by requireAuth
      user?: {
        id: string; // Better Auth user id (string)
        email: string;
        name: string;
        role: string; // "admin" | "vendor" | "user" (user = reseller)
        emailVerified: boolean;
        impersonatedBy?: string; // admin user id, when an admin is acting as this user
      };

      // Set by loadReseller / loadVendor (full Mongoose documents)
      reseller?: any;
      vendor?: any;

      // Set by validate(): the parsed, cleaned input
      validated?: {
        body?: any;
        query?: any;
        params?: any;
      };
    }
  }
}
