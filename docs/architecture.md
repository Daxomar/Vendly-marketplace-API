# Architecture

## Folder layout

```
src/
├── server.ts            starts the app: connect MongoDB + Redis, listen
├── app.ts               the request pipeline, in order (read this first)
├── config/
│   ├── env.ts           reads .env, stops early if something required is missing
│   ├── auth.ts          Better Auth: email/password, Google, verification, admin plugin, sign-up hook
│   └── cors.ts          which websites may call the API
├── db/
│   ├── mongo.ts         mongoose (our models) + raw client (Better Auth's collections)
│   └── redis.ts         cache, jobs, locks
├── routes/              ★ every URL lives here, grouped by audience
│   ├── index.ts         mounts everything under /api/v1, plus GET /me
│   ├── public.routes.ts
│   ├── reseller.routes.ts   guard chain applied once at the top
│   ├── vendor.routes.ts
│   └── admin.routes.ts
├── modules/             one folder per business domain
│   ├── profiles/        /me, reseller profile + store branding, vendor profile
│   ├── vendors/         admin: create, list, approve/suspend vendors
│   └── catalog/         categories (products arrive in Stage 3)
├── models/              Mongoose schemas (see docs/data-model.md)
├── middleware/          requireAuth, requireRole, loadReseller, loadVendor, validate, rate limits, errors
├── lib/                 wrappers for outside services: email, cloudinary, logger
├── utils/               AppError, respond, codes, slug, money
├── types/express.d.ts   what our middleware adds to req
└── scripts/seed.ts      test data
```

## How a request flows

Every request goes through `app.ts` top to bottom:

```
requestId → CORS → [/api/auth/* → Better Auth, done]
         → cookie + JSON parsing → /health
         → /api/v1 routes → 404 → errorHandler
```

Inside a routes file, a reseller request looks like this:

```
PATCH /api/v1/reseller/store-config   { "branding": { "tagline": "Fresh picks" } }

generalLimiter        too many requests?           → 429 RATE_LIMITED
requireAuth           no session cookie?           → 401 UNAUTHORIZED      · else req.user
requireRole("user")   not a reseller?              → 403 INSUFFICIENT_PERMISSIONS
loadReseller          suspended?                   → 403 ACCOUNT_SUSPENDED · else req.reseller
validate(schema)      bad / unknown fields?        → 400 VALIDATION_ERROR  (unknown fields are dropped)
controller            calls profileService.updateStoreConfig(req.reseller._id, req.body)
service               business rules; throws AppError if something's wrong
response              { "success": true, "data": { ...updated config } }
```

Any error thrown anywhere ends up in `middleware/errorHandler.ts`, which always answers
`{ success: false, code, message, details? }`. Unexpected errors (bugs) become a 500 with a
`requestId` you can search for in the logs.

## Auth (Better Auth)

- Mounted at `/api/auth/*` in `app.ts`. All sign-up, sign-in, sign-out, session, email
  verification and password-reset endpoints come from Better Auth; see `docs/api.md`.
- Better Auth stores its own collections: `user`, `session`, `account`, `verification`.
- Roles live on the Better Auth user: `admin`, `vendor`, `user` (= reseller).
- **Business data is separate.** Our profiles link back with `userId`:
  - Public sign-up → hook in `config/auth.ts` creates `ResellerProfile` + `StoreConfig`.
    If that ever fails, `loadReseller` / `GET /me` recreate it (self-healing).
  - Vendors are created by an admin (`POST /api/v1/admin/vendors`), which creates the login
    and the `VendorProfile` together.
- **Impersonation:** while Vendly manages vendor accounts, an admin calls
  `POST /api/auth/admin/impersonate-user` and then uses the normal vendor endpoints.
  `GET /me` shows `impersonatedBy` during that time. `POST /api/auth/admin/stop-impersonating` ends it.

## Redis

Used for fast, temporary data only. MongoDB is always the source of truth.
- Stage 2: cache of store lookups (`/s/{resellerCode}/{storeSlug}`)
- Stage 4: background jobs (release unpaid stock, commission holding period, emails) and a
  lock so a Paystack webhook is never processed twice

## Stages

1. ✅ Structure, auth, profiles, admin vendor management, seed
2. Tenancy: join/leave vendors, reseller stores, public store endpoints, Redis store cache
3. Catalogue: vendor products + variants + images, reseller prices
4. Orders and money: cart quote, checkout, Paystack, delivery, commissions, payouts
