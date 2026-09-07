# Berna Gee — Data, Minutes & SMS Marketplace

A fast, AI-assisted data/airtime bundle storefront with M-Pesa (Safaricom Daraja) STK Push checkout, a client-facing site, and a full admin control panel.

## Stack

- **Next.js 16 (App Router, TypeScript)** — single deployable app for both the client site and admin panel
- **Prisma + SQLite** (swap `DATABASE_URL` for Postgres/MySQL in production if you prefer)
- **Tailwind CSS v4** — custom design system (see `src/app/globals.css`)
- **JWT sessions** (via `jose`) for admin auth, `bcryptjs` for password hashing
- **Safaricom Daraja API** — STK Push (Lipa na M-Pesa Online) for client payments

## Features

### Client site (no account required)
- Browse Data / Minutes / SMS / Combo bundles by category
- Buy a bundle: enter phone number → STK push prompt → live status polling → success/failure feedback
- "Ask AI" assistant: recommends bundles from natural-language requests (e.g. "cheap data for streaming under 60 bob"); falls back to a built-in rule engine, and will use Anthropic's API automatically if `ANTHROPIC_API_KEY` is set for more natural replies
- "Leave a message" contact panel — queries land in the admin Messages inbox

### Admin panel (`/admin`)
- Secure login (JWT session cookie), protected by middleware
- **Dashboard**: revenue, pending/failed orders, recent transactions, 7-day revenue chart
- **Packages**: create/edit/delete categories and packages (price, validity, badges, visibility)
- **Payment Settings**: edit the Daraja API credentials (consumer key/secret, passkey, short code, Paybill/Till mode, sandbox/production, callback URL) — encrypted at rest, editable without a redeploy
- **Site Settings**: business name, tagline, support/WhatsApp numbers
- **Admins**: only a Super Admin can add/disable/remove other admin accounts
- **Messages**: view and manage customer queries from the contact panel
- **Transactions**: filterable list of all payment attempts

## Getting started

```bash
npm install
npm run db:migrate   # creates the SQLite DB and applies the schema
npm run db:seed      # seeds categories, packages, site settings, and the super admin
npm run dev
```

The app runs at http://localhost:3000, admin panel at http://localhost:3000/admin.

### Default super admin

Seeded on first run:

- Email: `annmbaya25@outlook.com`
- Password: `ChangeMe123!`

**Change this password immediately after first login** (via the M-Pesa/site settings you can add a new admin and disable/replace this one — a "change password" self-service screen is a good next addition).

## Configuring M-Pesa (Daraja) payments

Payments are **off by default** until an admin fills in the Daraja credentials — no code changes or redeploys needed:

1. Log in to `/admin`, go to **Payment Settings**.
2. Choose environment (`sandbox` for testing, `production` for live).
3. Enter your **Business Short Code / Till Number**, **Consumer Key**, **Consumer Secret**, and **Passkey** (from your [Daraja app](https://developer.safaricom.co.ke/)).
4. Set **Callback base URL** to your publicly reachable domain (e.g. `https://yourdomain.com`) — Safaricom will POST payment results to `{that URL}/api/mpesa/callback`. This must be a real, internet-reachable HTTPS URL for STK push to complete; `localhost` will not work for actual payment confirmation.
5. Choose **Paybill** or **Till Number (Buy Goods)** mode to match your short code type.
6. Save. The client checkout flow will immediately start using these credentials.

The seed script pre-fills the well-known **public Safaricom sandbox test passkey** so sandbox testing works out of the box once you add your own sandbox consumer key/secret from the Daraja portal.

### Fulfilling the actual data/minutes/SMS bundle

This app handles the **payment** leg (STK push, confirmation, receipt) end-to-end. Actual bundle provisioning (topping up the customer's line with the purchased data/minutes/SMS) depends on your upstream reseller/aggregator or Safaricom enterprise API, which is specific to your business arrangement and isn't part of the public Daraja collection. The natural extension point is `src/app/api/mpesa/callback/route.ts` — once a transaction is marked `SUCCESS`, trigger your fulfillment call there.

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma datasource, defaults to local SQLite file |
| `APP_ENCRYPTION_KEY` | AES-256-GCM key used to encrypt Daraja secrets at rest — **keep private, back it up** |
| `JWT_SECRET` | Signs admin session tokens |
| `ANTHROPIC_API_KEY` | Optional — enables richer AI assistant replies via Claude; the assistant works without it using a built-in recommendation engine |

Generate fresh secrets for production:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploying (e.g. Railway)

`npm start` runs `prisma migrate deploy && npm run db:seed && next start` — so on every boot it applies pending migrations, seeds any *missing* default data (categories, sample packages, an M-Pesa config row, and the super admin, if none exist), then starts the server. Seeding is safe to run on every deploy: it only fills in rows that don't exist yet and never overwrites a package price, admin account, or settings you've already changed in the admin panel.

For this to work, the host must provide these environment variables **before the first boot**:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | See storage options below |
| `APP_ENCRYPTION_KEY` | Yes | 32+ byte random hex string |
| `JWT_SECRET` | Yes | 32+ byte random hex string |
| `ANTHROPIC_API_KEY` | No | Optional, richer AI assistant replies |

Generate the two secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Without `DATABASE_URL` set, `prisma migrate deploy` fails immediately and the deploy stops (visibly, in the build/deploy logs) rather than starting a broken server that 500s on every request.

### Database storage on Railway (or any container host with an ephemeral filesystem)

SQLite is a single file — if it's written to the container's local disk with **no persistent volume attached**, it is wiped on every redeploy or restart, taking every admin account, transaction, and price edit with it. For a live payment app, pick one of:

- **Recommended: Railway Postgres plugin.** Add a Postgres database from Railway's "+ New" menu, then set this app's `DATABASE_URL` to the plugin's connection string (Railway lets you reference it as `${{Postgres.DATABASE_URL}}`). Then change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`, delete the `prisma/migrations` folder, and run `npx prisma migrate dev --name init` once locally against a Postgres instance to generate fresh Postgres-flavored migrations before deploying.
- **Simpler: a Railway Volume.** Attach a volume to this service (e.g. mounted at `/data`) and set `DATABASE_URL=file:/data/prod.db`. Keeps SQLite, but only works with a single instance (no horizontal scaling) and ties your data to that one volume.

## Project structure

```
prisma/schema.prisma        Data model (Admins, Categories, Packages, Transactions, MpesaConfig, SiteSettings, ContactMessage)
src/lib/mpesa.ts            Daraja OAuth, STK push, STK query
src/lib/crypto.ts           AES-256-GCM encrypt/decrypt for stored API secrets
src/lib/auth.ts             JWT session helpers
src/lib/assistant.ts        AI assistant recommendation engine
src/app/(client pages)      Public storefront
src/app/admin/*             Admin panel pages
src/app/api/*               REST API routes (public + admin-guarded)
```

## Notes

- Client checkout never requires an account — only a phone number.
- All admin-mutating API routes are guarded server-side (`requireAdmin` / `requireSuperAdmin`), not just hidden in the UI.
- M-Pesa credentials are stored encrypted in the database, never in plaintext or client-visible responses (masked on read).
