# Berna Gee — Data, Minutes & SMS Marketplace

A fast, AI-assisted data/airtime bundle storefront with M-Pesa (Safaricom Daraja) STK Push checkout, a client-facing site, and a full admin control panel.

## Stack

- **Next.js 16 (App Router, TypeScript)** — single deployable app for both the client site and admin panel
- **Prisma + PostgreSQL** — durable storage for a live payment app (a single Postgres instance handles concurrent writes and survives redeploys, unlike a container-local SQLite file)
- **Tailwind CSS v4** — custom design system (see `src/app/globals.css`)
- **JWT sessions** (via `jose`) for admin auth, `bcryptjs` for password hashing
- **Pluggable payment gateway** — M-Pesa Daraja (direct STK Push) or Pesapal (hosted checkout), switchable by the admin at any time

## Features

### Client site (no account required)
- Browse Data / Minutes / SMS / Combo bundles by category
- Buy a bundle: enter phone number → STK push prompt → live status polling → success/failure feedback
- "Ask AI" assistant: recommends bundles from natural-language requests (e.g. "cheap data for streaming under 60 bob"); falls back to a built-in rule engine, and will use Anthropic's API automatically if `ANTHROPIC_API_KEY` is set for more natural replies
- "Leave a message" contact panel — queries land in the admin Messages inbox

### Admin panel (`/admin`)
- Secure login (JWT session cookie), protected by middleware
- **Dashboard**: revenue, pending/failed orders, recent transactions, 7-day revenue chart, and a red alert banner whenever the active gateway is unconfigured or a payment recently failed due to *our own* system/API issue (never shown to customers — see below)
- **Packages**: create/edit/delete categories and packages (price, validity, badges, visibility)
- **Payment Settings**: pick the **active payment gateway** (M-Pesa Daraja or Pesapal) and edit each gateway's API credentials independently — encrypted at rest, switchable/editable without a redeploy
- **Site Settings**: business name, tagline, support/WhatsApp numbers
- **Admins**: only a Super Admin can add/disable/remove other admin accounts
- **Messages**: view and manage customer queries from the contact panel
- **Transactions**: filterable list of all payment attempts, which gateway handled each one, and — for failures — the real technical cause with a flag distinguishing "our system/API is broken" from "the customer/gateway declined it"

## Getting started

Requires a Postgres database (local install, Docker, or a free hosted instance — e.g. Railway, Supabase, Neon).

```bash
npm install
# set DATABASE_URL, APP_ENCRYPTION_KEY and JWT_SECRET in .env — see below
npm run db:migrate   # applies the schema to your Postgres database
npm run db:seed      # seeds categories, packages, site settings, and the super admin
npm run dev
```

The app runs at http://localhost:3000, admin panel at http://localhost:3000/admin.

### Default super admin

Seeded on first run:

- Email: `annmbaya25@outlook.com`
- Password: `ChangeMe123!`

**Change this password immediately after first login** (via the M-Pesa/site settings you can add a new admin and disable/replace this one — a "change password" self-service screen is a good next addition).

## Payment gateways: M-Pesa Daraja and Pesapal

Customers always pay with M-Pesa — **Payment Settings** only controls which API processes that payment behind the scenes. Both gateways can be configured at the same time; a segmented switch at the top of the page picks which one is live, and flipping it takes effect immediately (no redeploy). Payments are **off by default** on both until an admin finishes setup.

### M-Pesa Daraja (direct STK Push)

1. Log in to `/admin` → **Payment Settings** → **M-Pesa Daraja API** panel.
2. Choose environment (`sandbox` for testing, `production` for live).
3. Enter your **Business Short Code / Till Number**, **Consumer Key**, **Consumer Secret**, and **Passkey** (from your [Daraja app](https://developer.safaricom.co.ke/)).
4. Set **Callback base URL** to your publicly reachable domain (e.g. `https://yourdomain.com`) — Safaricom POSTs payment results to `{that URL}/api/mpesa/callback`. This must be a real, internet-reachable HTTPS URL; `localhost` will not work for actual payment confirmation.
5. Choose **Paybill** or **Till Number (Buy Goods)** mode to match your short code type.

The seed script pre-fills the well-known **public Safaricom sandbox test passkey** so sandbox testing works once you add your own sandbox consumer key/secret from the Daraja portal.

### Pesapal (hosted checkout)

1. **Payment Settings** → **Pesapal** panel.
2. Enter environment, **Consumer Key**, **Consumer Secret** (from your [Pesapal merchant account](https://www.pesapal.com/)), and **Callback base URL**.
3. Saving automatically registers the IPN webhook (`{callback URL}/api/pesapal/callback`) with Pesapal — the panel shows whether that succeeded.
4. On checkout, the customer completes payment inside an embedded Pesapal page (they can still choose M-Pesa there); the app polls in the background and detects completion automatically, same as the Daraja flow.

Pesapal's exact field names/response shape were implemented from Pesapal's published API v3 documentation (no sandbox credentials were available to test end-to-end during development) — verify against your own Pesapal sandbox before going live, and watch the first few transactions in **Transactions** closely.

### Switching gateways safely

Switching to a gateway that isn't fully configured shows an immediate warning in the admin panel and a red banner on the Dashboard — customers would see generic "payment failed" errors until it's fixed. Configure a gateway fully before switching to it.

## How payment failures are shown

A failed payment is either the **customer's** situation (wrong PIN, cancelled, insufficient balance — legitimate for them to see) or **our system's** fault (bad API credentials, gateway outage, misconfiguration — never the customer's fault or problem to read a technical reason for):

- Customer-facing responses (`/api/checkout`, `/api/checkout/status/*`) only ever show a generic "please try again / contact support" message when the failure is on our side. Genuine gateway declines (Safaricom/Pesapal's own reason) are shown as-is, since those are actually useful to the customer.
- Every transaction records `failureSource` (`SYSTEM` vs `PROVIDER`) and the real `resultDesc`, visible only in the admin **Transactions** table (with a red warning icon for `SYSTEM` failures) and summarized in the **Dashboard** alert banner.

### Fulfilling the actual data/minutes/SMS bundle

This app handles the **payment** leg (STK push, confirmation, receipt) end-to-end. Actual bundle provisioning (topping up the customer's line with the purchased data/minutes/SMS) depends on your upstream reseller/aggregator or Safaricom enterprise API, which is specific to your business arrangement and isn't part of the public Daraja collection. The natural extension point is `src/app/api/mpesa/callback/route.ts` — once a transaction is marked `SUCCESS`, trigger your fulfillment call there.

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string, e.g. `postgresql://user:password@host:5432/dbname` |
| `APP_ENCRYPTION_KEY` | AES-256-GCM key used to encrypt Daraja secrets at rest — **keep private, back it up** |
| `JWT_SECRET` | Signs admin session tokens |
| `ANTHROPIC_API_KEY` | Optional — enables richer AI assistant replies via Claude; the assistant works without it using a built-in recommendation engine |

Generate fresh secrets for production:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploying (e.g. Railway)

`npm start` runs `prisma migrate deploy && npm run db:seed && next start` — so on every boot it applies pending migrations, seeds any *missing* default data (categories, sample packages, an M-Pesa config row, and the super admin, if none exist), then starts the server. Seeding is safe to run on every deploy: it only fills in rows that don't exist yet and never overwrites a package price, admin account, or settings you've already changed in the admin panel.

### Railway setup

1. **Add a Postgres database**: in your Railway project, click "+ New" → "Database" → "Add PostgreSQL". Railway provisions it and exposes a connection string.
2. **Set this service's environment variables** (Service → Variables):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Reference the Postgres plugin's URL: `${{Postgres.DATABASE_URL}}` (Railway autocompletes this once the Postgres plugin exists in the project) |
   | `APP_ENCRYPTION_KEY` | A random 32-byte hex string — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `JWT_SECRET` | Another random 32-byte hex string, generated the same way (use a different value than the one above) |
   | `ANTHROPIC_API_KEY` | Optional — enables richer AI assistant replies |

3. **Redeploy.** On boot, `prisma migrate deploy` creates the schema on the fresh Postgres database, `npm run db:seed` populates default categories/packages/site settings and the super admin, then the server starts.

Without `DATABASE_URL` set, `prisma migrate deploy` fails immediately and the deploy stops (visibly, in the build/deploy logs) rather than starting a broken server that 500s on every request — that was the cause of the original deploy failure (missing environment variables, no database attached at all).

Postgres survives redeploys and restarts (unlike a container-local SQLite file, which is wiped every time), so this is safe for a live payment app from day one.

## Project structure

```
prisma/schema.prisma        Data model (Admins, Categories, Packages, Transactions, MpesaConfig, PesapalConfig, GatewaySettings, SiteSettings, ContactMessage)
src/lib/mpesa.ts            Daraja OAuth, STK push, STK query
src/lib/pesapal.ts          Pesapal OAuth, IPN registration, order submission, status query
src/lib/payments/gateway.ts Picks the active gateway and dispatches to the right adapter
src/lib/payments/daraja.ts  Adapts mpesa.ts to the common payment interface
src/lib/payments/pesapal.ts Adapts pesapal.ts to the common payment interface
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
- Both gateways' API credentials are stored encrypted in the database, never in plaintext or client-visible responses (masked on read).
