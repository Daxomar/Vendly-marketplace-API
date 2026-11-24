# Data model

Money is always **integer pesewas** (₵130.00 = `13000`).

## How the pieces connect

```
Better Auth user ──(userId)── ResellerProfile ──── StoreConfig (1 per reseller: brand)
       │                            │
       │                            └── VendorMembership ── VendorProfile ──(userId)── Better Auth user
       │                                  (= one store:                │
       │                                   /s/AMA42/gadgets)           ├── Product ── Variant (price, stock)
       │                                                               │
       └── role: admin | vendor | user(reseller)          ResellerPrice (reseller × variant)

Category (platform-wide) ── Product
```

## From sign-up to a sale

1. **Reseller signs up** → Better Auth `user` (role `user`) → hook creates `ResellerProfile`
   (with `resellerCode`) + `StoreConfig` ("Ama's Picks").
2. **Admin creates a vendor** → `user` (role `vendor`) + `VendorProfile` (approved → `vendorCode`).
3. **Vendor lists products** → `Product` + one or more `Variant`s (vendorPrice, basePrice, stock).
4. **Reseller joins the vendor** → `VendorMembership` (auto-approved) with `storeSlug` + `storeTitle`.
   That membership *is* the store: `vendly.com/s/{resellerCode}/{storeSlug}`.
5. **Reseller sets prices** (optional) → `ResellerPrice` per variant. No record = sells at basePrice.
6. **Customer buys** from the store link → order with price snapshots (Stage 4).

## Collections (Stage 1)

### Better Auth (managed by Better Auth)
`user` { id, name, email, emailVerified, role, banned, phoneNumber } · `session` · `account` · `verification`

### ResellerProfile
| Field | Notes |
|---|---|
| userId | → Better Auth user id (string), unique |
| name, email, phoneNumber | copied from the user for fast lists |
| resellerCode | unique, used in store links (`AMA42`) |
| status | `active` / `suspended` |
| balances.pending / available / paidOut | pesewas; only commission/payout code changes these |
| totalSales | count of completed items |
| payoutDetails | { method: momo/bank, network, accountName, accountNumber } |

### VendorProfile
| Field | Notes |
|---|---|
| userId | → Better Auth user id, unique |
| businessName, slug | slug unique (`techhub`), for the vendor directory |
| vendorCode | unique, set on approval; used in join links only (`TECHHUB`) |
| status | `pending` / `approved` / `suspended` (only approved vendors can use vendor routes) |
| description, logoUrl, logoPublicId | |
| contact { phone, email, address } | |
| pickupLocation { address, area, city } | where riders collect orders |
| categoryIds | → Category (directory + default store names) |
| payoutDetails | like the reseller's |
| managedByAdmin | true while Vendly runs the account |
| approvedAt | |

### VendorMembership (one reseller ↔ one vendor = one store)
| Field | Notes |
|---|---|
| resellerId | → ResellerProfile |
| vendorId | → VendorProfile |
| status | `approved` (default for now) / `pending` / `left` / `blocked` |
| joinedVia | `code` / `directory` / `admin` |
| storeSlug | unique per reseller (`gadgets`); never the vendor's name |
| storeTitle | "Ama's Gadgets" |

Indexes: unique `{resellerId, vendorId}`, unique `{resellerId, storeSlug}`,
`{resellerId, status}`, `{vendorId, status}`.

Neither profile stores an array of the other; this collection is the only link.

### StoreConfig (the reseller's brand, shared by all their stores)
resellerId (unique) · branding { storeName, tagline, logoUrl, logoPublicId, themePreset } ·
contact { whatsapp, instagram, tiktok } · isActive

### Category (platform-wide)
name · slug (unique) · parentId · attributeTemplate [{ key, label, type, options, required }] · sortOrder · isActive

### Product (belongs to one vendor)
vendorId · title · slug (unique per vendor) · categoryId · brand · description ·
images [{ url, publicId }] · attributes (map) · variantOptions [{ name, values }] ·
status (`draft` / `active` / `archived`) · isFeatured

### Variant (what customers actually buy)
| Field | Notes |
|---|---|
| productId, vendorId | |
| options, label | `{ Storage: "128GB", Colour: "Black" }` → "128GB / Black"; "Default" if none |
| sku | unique |
| vendorPrice | what the vendor receives |
| basePrice | what resellers see as base; must be ≥ vendorPrice |
| stock, reservedStock | reservedStock = held by unpaid orders (Stage 4) |
| isActive | |

### ResellerPrice
resellerId · variantId · vendorId · price. Unique `{resellerId, variantId}`.
Customer pays `max(price, basePrice)`; reseller profit = `max(0, price − basePrice)`.

## Coming in Stage 4
Order (items with price snapshots, delivery, payment) · Commission · VendorSettlement · Payout
