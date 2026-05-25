# DECISIONS.md

Running log of non-obvious choices made while building Anaaj Mandi v1. Each entry: what, why, and what we deferred.

---

## Step 1 — scaffolding

### D1. Auth transport: same-site cookie, web proxies API

Web calls Fastify through a thin Next API route (`/app/api/*`), and Fastify issues a JWT in an httpOnly cookie. Keeps everything on one origin in dev (`localhost:3000`) and prod, so we avoid a CORS/cookie cross-domain story.

### D2. Photo upload: signed direct upload from browser

`apps/api` exposes a signed-upload endpoint, the browser POSTs files directly to Cloudinary, then we send the resulting secure URL back to `POST /lots/:id/photos`. Avoids streaming bytes through Fastify and keeps the API process cheap.

### D3. Price feed: seeded manual ticks + admin entry only

No external scraper in v1. The seed inserts today's Indore wheat ticks; admins add new ticks via `/admin`. This keeps the demo deterministic and removes a third-party failure mode. Real Agmarknet scraping is a v1.1 problem.

### D4. JWT in httpOnly cookie, not bearer token

Server components in Next 14 need access to auth in `cookies()` without extra plumbing. A cookie also survives full page reloads with no client-side hydration cost.

### D5. Mongo + Redis run via docker-compose, not Atlas/Upstash in dev

Local-only dev keeps the loop fast. Production hosting is a v1.1 problem.

### D6. Zod 3.23 (not 4.x)

`@hookform/resolvers` and a few other ecosystem packages are still catching up to Zod 4. Sticking with 3.23 avoids resolver-shim weirdness in `apps/web` forms.

### D7. Single `tsconfig.base.json` at the repo root + `@anaaj/tsconfig` for variants

Each workspace extends the root base. `@anaaj/tsconfig` adds `next.json` and `node.json` overlays so Next and Node packages don't repeat the same compilerOptions. Avoids a single mega-config that pretends to be both DOM and Node.

### D8. Fastify 4 (not 5) for v1

Fastify 5 is fine, but `@fastify/jwt` / `@fastify/cookie` / `@fastify/rate-limit` are all stable on Fastify 4. Pinning to 4 saves us a round of plugin-version detective work today.

### D9. ESLint flat config at root, app-specific overrides allowed

Single source of lint rules. `apps/web` adds `next/core-web-vitals` via its own `.eslintrc.json` because `next lint` doesn't yet read flat config — once it does in Next 15, we collapse this.

### D10. Husky 9 + lint-staged, no commit-msg hook

Pre-commit runs Prettier on staged files. Commit-msg lint (commitlint) deferred — too prescriptive for solo-build v1.

### D11. Hinglish copy in English-only UI

Microcopy uses words like "Namaste", "Mandi rate", "Quintal" because that's the user's vocabulary, but the UI strings are still in the `en` locale. Full i18n deferred to v1.1.

### D12. Repo-local git author (`gjgaurav9 / gjgaurav9@gmail.com`)

Set via `git config user.name/email` inside the repo only — global git config untouched.

---

## Step 2 — shared Zod schemas (`@anaaj/types`)

### D13. ObjectId as 24-char hex string everywhere

Zod schemas use `ObjectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i)` rather than a Mongo `ObjectId` type. The same schema is then valid in the browser (where there is no `bson`), in API request bodies, and in Mongoose pre-save coercion. Server-side helpers convert to `Types.ObjectId` only at the model boundary.

### D14. Phone regex pinned to Indian mobile numbers

`/^\+91[6-9]\d{9}$/` — first digit after `+91` must be 6, 7, 8, or 9 (TRAI mobile numbering). Landlines and overseas numbers are rejected outright since v1 is Indore-only.

### D15. Money on the wire is paise (integer), never rupees (float)

`PaiseSchema = z.number().int().nonnegative()`. Rupees are a display-layer concern; formatters in `apps/web/lib` will divide by 100 and apply Indian comma grouping. No floating-point money anywhere.

### D16. Cross-field refine on `PriceTick`

`price_min ≤ price_modal ≤ price_max` enforced at the Zod level so a bad admin entry never reaches Mongo.

### D17. `CreateLotInput.photos` defaults to `[]`, `LotSchema.photos` requires min 1

A lot can be saved as a draft without photos, but the public `Lot` shape always has at least one URL. The transition from draft → active is the moment that constraint flips on — enforced in the API service layer in step 5.

### D18. `ListLotsQuery` uses `z.coerce` for every numeric param

Query strings are strings. `z.coerce.number()` lets the route handler validate `?page=2&radius_km=50` directly without manual `Number()` casts.

### D19. `grain: 'wheat'` is a `z.literal`, not an enum (yet)

V1 is wheat-only and we want a type error if someone forgets and ships a multi-grain UI without first widening the schema. The literal is trivially replaceable with `z.enum(['wheat', 'rice', ...])` later.

### D20a. Redis remapped to host port 6380 (container still 6379)

Another dev project on this machine already holds host port 6379. To stay decoupled, our docker-compose binds host `6380` → container `6379`, and `.env.example` points `REDIS_URL` at `redis://localhost:6380`. Inside docker compose, any future containerised API talks to `redis:6379` directly.

### D20. Schemas import each other via `.js` extensions

`packages/types` is ESM (`"type": "module"`). TypeScript with `moduleResolution: "Bundler"` plus Node ESM both happily resolve `./common.js` from a `.ts` source. Keeps consumer apps (`apps/api` ESM) working when @anaaj/types ships as compiled JS later.

---

## Step 3 — Mongoose models + seed (`@anaaj/db`)

### D21. Models live only in `packages/db/src/models/`

API routes never instantiate `mongoose.Schema` themselves. The rule keeps schema/model drift impossible and gives the API code one place to mock for tests.

### D22. Custom timestamp field names (`created_at` / `updated_at`)

`{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }`. Aligns with the Zod schemas in `@anaaj/types` and avoids camel/snake conversion at every API boundary.

### D23. `_id` cast through `unknown` in the seed

Mongoose 8's `InferSchemaType` doesn't model the auto-injected `_id`, so seed code that extracts IDs out of inserted documents needs an explicit `as unknown as Types.ObjectId`. Documented here so the next person doesn't try to "clean it up" without understanding the inference gap. A proper fix is a typed `Hydrated*` alias per model — deferred.

### D24. `InquiryModel` has `created_at` only (no `updated_at`)

Inquiry rows are essentially append-only events. The 24h dedupe checks `created_at`; status transitions overwrite the same row but we don't bother maintaining `updated_at` for it.

### D25. The compound `(buyer_id, lot_id)` index on inquiries is **not unique**

A buyer can re-inquire on the same lot after the 24h window. Uniqueness would prevent that. The window is enforced in the service layer in step 5.

### D26. Seed refuses to run with `NODE_ENV=production` unless `FORCE_SEED=true`

Cheap insurance against pointing the seed at a real cluster. The seed drops collections before reinserting, so a misfire is catastrophic.

### D27. Demo phone numbers all start with `+91 98000000xx`

Easy to remember, easy to demo, all valid Indian mobile prefixes (9 → 8 → digits). OTP `123456` works for any of them in dev.

### D28. Photos in seed use `res.cloudinary.com/demo/...` placeholder URLs

The HTTPS validator accepts them, the `LotCard` will happily render them, and we don't need a real Cloudinary account to demo browse/detail. Real signed direct uploads land in step 5.
