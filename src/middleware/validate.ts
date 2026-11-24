// Checks request input against Zod schemas before the controller runs.
// Bad input → 400 VALIDATION_ERROR with a list of { field, message }.
//
// Usage in a routes file:
//   router.patch("/profile", validate({ body: updateProfileSchema }), controller.updateProfile)
//
// The cleaned input is on req.validated.body / .query / .params
// (req.body is also replaced with the cleaned body).
import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

type Schemas = { body?: ZodType; query?: ZodType; params?: ZodType };

export const validate = (schemas: Schemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.validated = {};
    // .parse throws a ZodError on bad input; errorHandler turns it into a 400
    if (schemas.params) req.validated.params = schemas.params.parse(req.params);
    if (schemas.query) req.validated.query = schemas.query.parse(req.query);
    if (schemas.body) {
      req.validated.body = schemas.body.parse(req.body ?? {});
      req.body = req.validated.body;
    }
    next();
  };
};
