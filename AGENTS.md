# Vendly API: rules for anyone (or any AI) changing this code

## What this is
A multi-vendor reseller marketplace for Ghana.
- **Admin** (Vendly team) creates and manages vendors.
- **Vendors** list products (Vendly runs their accounts for now, via impersonation).
- **Resellers** sign up once, join any number of vendors, set their own prices and share store links.
- **Customers** buy from a reseller's store link. No account.

One reseller store = one reseller + one vendor: `vendly.com/s/{resellerCode}/{storeSlug}`.
The vendor's name never appears to customers; stores carry the reseller's brand.

Stack: Express 5 + TypeScript (light) + MongoDB/Mongoose + Better Auth + Redis + Paystack.

## Commands
- `docker compose up -d`: start MongoDB (replica set) + Redis locally
- `npm run dev`: API with hot reload on http://localhost:5000
- `npm run seed`: wipe local DB and load test data (prints logins)
- `npm run typecheck`: TypeScript check, run before every commit
- `npm run build` / `npm start`: production build and run

## Structure
- `src/app.ts`: the request pipeline, in order. Better Auth is mounted BEFORE `express.json()`.
- `src/routes/`: one router per audience (`public`, `reseller`, `vendor`, `admin`). URLs and middleware chains only. The guard chain is applied once at the top of each file.
- `src/modules/<domain>/`: `*.controller.ts`, `*.service.ts`, `*.validation.ts`
- `src/models/`: Mongoose models (import from `models/index.js`)
- `src/middleware/`, `src/utils/`, `src/lib/` (outside services), `src/config/`
- Details: `docs/architecture.md`, `docs/data-model.md`, `docs/api.md`

## Layer rules
| Layer | Does | Never |
|---|---|---|
| routes | URL + middleware chain → controller | business logic |
| controller | read `req` → call ONE service → `ok()` / `created()` | touch models, try/catch |
| service | business rules, DB queries, throw `AppError` | read `req` / `res` |
| model | schema, indexes, small validation hooks | call services |

A new endpoint = Zod schema (validation.ts) + service function + small controller + one line in a routes file.

## Handler pattern
```ts
// routes/reseller.routes.ts
router.patch("/profile", validate({ body: updateResellerProfileSchema }), profileController.updateResellerProfile);

// modules/profiles/profile.controller.ts
export async function updateResellerProfile(req: Request, res: Response) {
  ok(res, await profileService.updateResellerProfile(req.reseller._id, req.body));
}

// modules/profiles/profile.service.ts
if (!profile) throw notFound("PROFILE_NOT_FOUND", "Reseller profile not found");
```
No try/catch in controllers: Express 5 sends thrown errors to `middleware/errorHandler.ts`.

## Non-negotiables
- **Money is integer pesewas** (₵1.00 = 100). Never floats, never cedis in the database.
- **Customer price = max(resellerPrice, basePrice).** Reseller profit is never below 0.
- `basePrice >= vendorPrice` always. Vendly's margin = basePrice − vendorPrice.
- **Scope every query by the caller:** vendor code uses `req.vendor._id`, reseller code uses `req.reseller._id`. Never trust an id from the body for ownership.
- **Orders store price snapshots.** Never recompute past orders from current prices.
- Every route with input has `validate(...)`. Schemas list allowed fields only, so protected fields (balances, codes, status) can't be set by users.
- Responses: `{ success: true, data, meta? }` / `{ success: false, code, message, details? }`. The frontend switches on `code`.
- Error codes are `SCREAMING_SNAKE_CASE` and stable. Throw via `AppError` helpers (`badRequest`, `forbidden`, `notFound`, `conflict`).
- No "system reseller": a store needs a valid resellerCode + storeSlug, or it 404s.
- Never commit `.env`. New env vars go in `.env.example` AND `src/config/env.ts`.
- Redis holds temporary things only (cache, jobs, locks). MongoDB is the source of truth.

## Style
- TypeScript stays light (`strict: false`, like StreamSell). Type function inputs; use `any` rather than fighting the compiler. Readability first.
- Short comments that explain WHY, at the top of each file and on anything non-obvious.
- Files: `camelCase.layer.ts` (`vendor.service.ts`, `vendorProfile.model.ts`). Imports end in `.js` (NodeNext).
- Routes are audience-first: `/api/v1/reseller/...`, `/api/v1/vendor/...`, `/api/v1/admin/...`.

## Glossary
- **Reseller** = Better Auth role `"user"` + `ResellerProfile` (created by the sign-up hook in `config/auth.ts`).
- **Vendor** = role `"vendor"` + `VendorProfile` (created by an admin).
- **Membership** = one reseller ↔ one vendor link; also one store (`storeSlug`, `storeTitle`).
- **Variant** = the buyable unit (e.g. 128GB / Black). Prices and stock live here.
- **vendorPrice** = what the vendor receives. **basePrice** = what resellers see as base.
- **resellerCode** = in store links. **vendorCode** = in join links only.
