# Vendly Marketplace API

Backend for Vendly: vendors list products, resellers sell them through their own branded
store links, customers buy without an account.

Rules for changing the code: **[AGENTS.md](AGENTS.md)** · How it fits together:
[docs/architecture.md](docs/architecture.md) · Data: [docs/data-model.md](docs/data-model.md) ·
Endpoints: [docs/api.md](docs/api.md)

## Run it locally

**Install once:** [Node.js 22 LTS](https://nodejs.org), Git, [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/Daxomar/Vendly-marketplace-API.git
cd Vendly-marketplace-API
npm install

# Create your env file, then generate a secret and paste it into BETTER_AUTH_SECRET
cp .env.example .env            # Windows PowerShell: copy .env.example .env
npm run gen:secret

# Start MongoDB + Redis (first time takes a minute to download)
docker compose up -d

# Fill the database with test data; it prints the logins at the end
npm run seed

# Start the API with hot reload
npm run dev
```

Open http://localhost:5000/health → `{"ok":true}`.

**Using MongoDB Atlas instead of Docker?** Put the Atlas connection string in `MONGODB_URI`
and only start Redis: `docker compose up -d redis`.

## Seed logins

| Role | Email | Password |
|---|---|---|
| Admin | admin@vendly.local | `SEED_ADMIN_PASSWORD` in .env (default `ChangeMe123!`) |
| Vendor: TechHub (join code TECHHUB) | techhub@vendly.local | `Password123!` |
| Vendor: StyleCo (join code STYLECO) | styleco@vendly.local | `Password123!` |
| Reseller: Ama (AMA42, joined both vendors) | ama@vendly.local | `Password123!` |
| Reseller: Kofi (KOFI7, no vendors yet) | kofi@vendly.local | `Password123!` |

`npm run seed` wipes and reloads the local database every time you run it.

## Try it

Import **`postman/vendly-api.postman_collection.json`** into Postman or Thunder Client. Sign in
with one of the logins above (the cookie is kept for you), then try the requests in each folder.

Without email configured, verification and password-reset links are printed in the API
terminal: copy them into your browser.

## Optional services (.env)

| Feature | Keys | Without them |
|---|---|---|
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | email + password only |
| Email | `SENDGRID_API_KEY`, `EMAIL_FROM` | links printed in the terminal |
| Image uploads | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | uploads refused; seed uses placeholder images |
| Payments | `PAYSTACK_SECRET_KEY` | needed from Stage 4 |

On startup the API prints which of these are on.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | API with hot reload |
| `npm run seed` | wipe + load test data |
| `npm run typecheck` | TypeScript check |
| `npm run build` / `npm start` | production build / run |
| `npm run gen:secret` | random secret for `BETTER_AUTH_SECRET` |
