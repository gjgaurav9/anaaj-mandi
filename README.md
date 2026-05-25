# Anaaj Mandi

> Indore ka wheat marketplace — sellers, brokers, buyers, ek hi jagah.

v1 grain marketplace focused on **wheat trade in Indore, MP**. Three roles: sellers (farmers / traders), brokers (mandi middlemen), buyers (mills / exporters). Core flow: seller lists a lot → buyer browses → buyer connects via WhatsApp → transaction is recorded post-sale.

> This README is a scaffold placeholder. Full setup, env, and demo accounts arrive in **step 11**.

## Tech stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Web:** Next.js 14 (App Router), Tailwind, shadcn/ui, React Hook Form + Zod
- **API:** Fastify 4, Mongoose 8, Zod request validation
- **Data:** MongoDB 7, Redis 7
- **Uploads:** Cloudinary (signed direct upload from browser)
- **Auth:** Phone OTP via Twilio Verify (dev stub: `123456`)
- **Shared:** `@anaaj/types` (Zod), `@anaaj/db` (Mongoose), `@anaaj/ui` (shadcn primitives)

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm docker:up         # mongo + redis
pnpm dev               # boots apps/web (3000) + apps/api (4000)
```

## Workspaces

| Path              | Package         | Purpose                                  |
| ----------------- | --------------- | ---------------------------------------- |
| apps/web          | @anaaj/web      | Next.js public site + authed app + admin |
| apps/api          | @anaaj/api      | Fastify REST API                         |
| packages/types    | @anaaj/types    | Zod schemas — single source of truth     |
| packages/db       | @anaaj/db       | Mongoose models + connect helper + seed  |
| packages/ui       | @anaaj/ui       | Shared shadcn-flavored primitives        |
| packages/tsconfig | @anaaj/tsconfig | Shared TypeScript configs                |
