# API reference (Stage 1)

Base URL locally: `http://localhost:5000`

Login uses a **cookie** set by Better Auth. Postman and Thunder Client keep it for you
automatically after you sign in; the browser does too (the frontend must send
`credentials: "include"`).

All `/api/v1` responses look like:
- success: `{ "success": true, "data": ..., "meta"?: {...} }`
- error: `{ "success": false, "code": "SOME_CODE", "message": "...", "details"?: ... }`

## Auth (Better Auth, at `/api/auth`)

These responses come from Better Auth, so they don't use the `{ success, data }` shape.

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/sign-up/email` | `{ name, email, password, phoneNumber?, callbackURL? }` | Creates a **reseller**. Sends a verification email (printed in the terminal if email isn't configured) |
| GET | `/api/auth/verify-email?token=...` | | The link from the email |
| POST | `/api/auth/send-verification-email` | `{ email, callbackURL? }` | Resend it |
| POST | `/api/auth/sign-in/email` | `{ email, password }` | Sets the session cookie. Unverified → 403 `EMAIL_NOT_VERIFIED` |
| POST | `/api/auth/sign-in/social` | `{ provider: "google", callbackURL }` | Only when Google keys are set |
| GET | `/api/auth/get-session` | | Current session or `null` |
| POST | `/api/auth/sign-out` | | |
| POST | `/api/auth/request-password-reset` | `{ email, redirectTo }` | Sends the reset link |
| POST | `/api/auth/reset-password` | `{ newPassword, token }` | |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }` | Logged in |

`callbackURL` / `redirectTo` should be full frontend URLs, e.g. `http://localhost:3000/dashboard`.

### Admin tools (Better Auth admin plugin; admin only)
| Method | Path | Body |
|---|---|---|
| POST | `/api/auth/admin/impersonate-user` | `{ userId }`: act as that user (e.g. a vendor) for up to 1 hour |
| POST | `/api/auth/admin/stop-impersonating` | `{}`: back to the admin |
| GET | `/api/auth/admin/list-users` | query: `searchValue`, `limit`, `offset`... |
| POST | `/api/auth/admin/ban-user` / `unban-user` | `{ userId }` |

## Any logged-in user

| Method | Path | Returns |
|---|---|---|
| GET | `/api/v1/me` | `{ user, role: "reseller" \| "vendor" \| "admin", profile, impersonatedBy }`. The frontend calls this after login to choose the dashboard |

## Public

| Method | Path | Returns |
|---|---|---|
| GET | `/health` | `{ ok: true }` |
| GET | `/api/v1/categories` | active categories |

## Reseller (`/api/v1/reseller`, role `user`)

| Method | Path | Body |
|---|---|---|
| GET | `/profile` | |
| PATCH | `/profile` | `{ name?, phoneNumber?, payoutDetails?: { method: "momo"\|"bank", network?, accountName, accountNumber } }` |
| GET | `/store-config` | |
| PATCH | `/store-config` | `{ branding?: { storeName?, tagline?, themePreset? }, contact?: { whatsapp?, instagram?, tiktok? } }` |

Theme presets: `emerald`, `midnight`, `sunset`, `ocean`, `rose`, `gold`.

## Vendor (`/api/v1/vendor`, role `vendor`, approved only)

| Method | Path | Body |
|---|---|---|
| GET | `/profile` | |
| PATCH | `/profile` | `{ description?, contact?: {...}, pickupLocation?: { address?, area?, city? }, payoutDetails? }` |

## Admin (`/api/v1/admin`, role `admin`)

| Method | Path | Body / query |
|---|---|---|
| POST | `/vendors` | `{ ownerName, email, password?, businessName, description?, phone?, categoryIds?, pickupLocation?, approve? (default true) }` |
| GET | `/vendors` | `?status=pending\|approved\|suspended&search=&page=1&limit=20` |
| GET | `/vendors/:vendorId` | |
| PATCH | `/vendors/:vendorId/status` | `{ status: "approved" \| "suspended" \| "pending" }`. First approval generates the `vendorCode` |

Leave `password` out when Vendly manages the vendor: admins act as the vendor through impersonation.

## Error codes you'll see

| Code | Status | When |
|---|---|---|
| `UNAUTHORIZED` | 401 | no / expired session |
| `INSUFFICIENT_PERMISSIONS` | 403 | wrong role for the route |
| `ACCOUNT_SUSPENDED` | 403 | reseller or vendor suspended |
| `VENDOR_NOT_APPROVED` | 403 | vendor still pending |
| `VALIDATION_ERROR` | 400 | bad input; `details` lists `{ field, message }` |
| `INVALID_ID` | 400 | malformed id |
| `DUPLICATE` | 409 | unique value already used |
| `RATE_LIMITED` | 429 | too many requests |
| `ROUTE_NOT_FOUND` | 404 | unknown URL |
| `INTERNAL_ERROR` | 500 | a bug; quote the `requestId` |
