# Anaaj Mandi

> Indore ka wheat marketplace — broker apne farmers ki listings upload kare, buyers WhatsApp pe direct connect kare.

A broker-centric v1 grain marketplace focused on wheat trade in Indore, MP. Brokers (mandi middlemen) are the primary app users — they collect farmer info offline and post listings here. Buyers (mills / exporters) browse and connect to the broker on WhatsApp. Farmers are not app users; their contact info lives embedded on each lot.

**Mobile-first** layout — every screen lives in a `max-w-md` centered column, so the UI looks like a phone app on any device.

## Tech stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Web:** Next.js 14 App Router, Tailwind, shadcn-flavored primitives, RHF + Zod
- **API:** Fastify 4, Mongoose 8, Zod request validation
- **Data:** MongoDB 7, Redis 7
- **Uploads:** Cloudinary (signed direct from browser — optional)
- **Auth:** Phone OTP via Twilio Verify (dev stub: `123456`)
- **Shared workspaces:** `@anaaj/types` (Zod), `@anaaj/db` (Mongoose), `@anaaj/ui` (Button / Card / Badge), `@anaaj/tsconfig`

## Local development

```bash
cp .env.example .env
pnpm install
pnpm docker:up     # mongo on 27017, redis on host port 6380
pnpm seed          # 1 admin · 3 brokers · 5 buyers · 10 wheat lots · today's price ticks
pnpm dev           # apps/web on :3000, apps/api on :4000
```

Demo accounts (OTP `123456` always works in dev):

| role   | phone           | name                            |
| ------ | --------------- | ------------------------------- |
| admin  | +91 98000 00099 | Anaaj Admin                     |
| broker | +91 98000 00011 | Lalit Agarwal (Indore Chhawni)  |
| broker | +91 98000 00012 | Vinod Jain (Laxmibai Nagar)     |
| broker | +91 98000 00013 | Mukesh Soni (Dewas)             |
| buyer  | +91 98000 00021 | Anita Mehta (Mehta Flour Mills) |
| buyer  | +91 98000 00022 | Rajesh Garg (Garg Aata)         |

## Workspaces

| Path              | Package         | Purpose                                  |
| ----------------- | --------------- | ---------------------------------------- |
| apps/web          | @anaaj/web      | Next.js public site + authed app + admin |
| apps/api          | @anaaj/api      | Fastify REST API                         |
| packages/types    | @anaaj/types    | Zod schemas — single source of truth     |
| packages/db       | @anaaj/db       | Mongoose models + connect helper + seed  |
| packages/ui       | @anaaj/ui       | Shared shadcn-flavored primitives        |
| packages/tsconfig | @anaaj/tsconfig | Shared TypeScript configs                |

## Deploy

Free-tier stack: **Vercel** (web) + **Fly.io** (api) + **Atlas M0** (mongo) + **Upstash** (redis) + **Cloudinary** (photos, optional).

### 1. Mongo Atlas (free M0)

1. Create an account at [cloud.mongodb.com](https://cloud.mongodb.com) → create an M0 (Free) cluster.
2. Pick the **Mumbai** region for low latency to the Fly app.
3. Network Access → Add IP → `0.0.0.0/0` (Atlas M0 has no static-IP option; Fly egress IPs change).
4. Database Access → Create user → save the password.
5. Connect → Drivers → copy the URI:
   `mongodb+srv://<user>:<pw>@<cluster>.mongodb.net/anaaj_mandi?retryWrites=true&w=majority`

### 2. Upstash Redis (free)

1. Sign up at [upstash.com](https://upstash.com), create a database in **AP-South** (Mumbai).
2. Copy the **Redis URL** (the `redis://default:<pw>@<host>:6379` form). Upstash also gives a TLS `rediss://` URL — either works with ioredis.

### 3. Cloudinary (optional, for photo uploads)

If you skip this, brokers can still publish lots with placeholder photos; `/lots/photos/sign` will return 503.

1. Sign up at [cloudinary.com](https://cloudinary.com), grab `cloud_name`, `api_key`, `api_secret` from the dashboard.

### 4. Fly.io for the API

```bash
# Install + login (once)
brew install flyctl
flyctl auth signup        # or: flyctl auth login

# From the monorepo root:
flyctl launch --copy-config --name anaaj-api --region bom --no-deploy

flyctl secrets set \
  MONGO_URI="mongodb+srv://…" \
  REDIS_URL="redis://default:…@…:6379" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  WEB_ORIGIN="https://anaaj-mandi.vercel.app" \
  CLOUDINARY_CLOUD_NAME=… \
  CLOUDINARY_API_KEY=… \
  CLOUDINARY_API_SECRET=…

flyctl deploy
# → https://anaaj-api.fly.dev
```

Once it's up, seed the cluster once:

```bash
MONGO_URI="mongodb+srv://…" pnpm --filter @anaaj/db seed
```

### 5. Vercel for the web

```bash
# Install + login (once)
npm i -g vercel
vercel login

# From the monorepo root:
vercel link                             # pick "anaaj-web" or create new
vercel env add NEXT_PUBLIC_API_BASE     # → https://anaaj-api.fly.dev
vercel env add JWT_COOKIE_NAME          # → am_session
vercel --prod
# → https://anaaj-mandi.vercel.app
```

Vercel auto-detects Next.js and uses the `apps/web` build because of `vercel.json`. If you prefer the dashboard: set the project root to `apps/web/`, build command to `cd ../.. && pnpm install && pnpm --filter @anaaj/web build`, output to `.next`.

After deploy, update Fly's `WEB_ORIGIN` secret to match Vercel's actual URL, then `flyctl deploy` once more to pick it up.

### 6. Smoke test prod

```bash
curl https://anaaj-api.fly.dev/health
# → {"ok":true,"data":{"status":"up","service":"anaaj-api"}}

curl https://anaaj-mandi.vercel.app/
# → 200, landing page
```

Sign in with a demo account (OTP `123456` still works since `OTP_DEV_BYPASS=true`). Turn it off only after wiring real Twilio Verify.

## Architecture pointers

- Auth: JWT in `httpOnly`, `SameSite=Lax` cookie. Web has a thin `/api/[...path]` reverse proxy that re-emits `Set-Cookie` on the web origin so server components can read it via `cookies()`.
- Money is stored as integer **paise** everywhere; rupees are a display-layer concern.
- Quantity is in **quintals** (1 q = 100 kg).
- Phones are E.164 (`+91XXXXXXXXXX`); regex pinned to Indian mobile prefixes.
- WhatsApp button posts an inquiry (`channel=whatsapp`) **and then** opens `wa.me/91…`, building a Hinglish template. 24-hour dedupe per buyer per lot.
- Sellers are not users — they're an embedded `{ name, phone, village }` on each lot, filled in by the broker.
- See [DECISIONS.md](./DECISIONS.md) for the running log of non-obvious choices.

## What's not in v1

- No payments / no Razorpay.
- No in-app chat — WhatsApp deep link only.
- No multi-grain (wheat only). Schemas designed to extend.
- No multi-language UI — English-only with Hinglish copy.
- No native apps — responsive PWA-flavored web.
