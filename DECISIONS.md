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

### D29. Mongoose models export explicit `I*` interfaces instead of `InferSchemaType`

Mongoose 8's `InferSchemaType` collapses to `{}` at some downstream call sites (e.g. `Awaited<ReturnType<typeof UserModel.findById>>` resolves to `{} | null`). We tripped over it in `apps/api/src/routes/me.ts`. Fix: each model now declares an explicit `IUser` / `ILot` / etc. interface and the schema is typed with `new Schema<IUser>(...)`. `UserDoc` (and friends) is `HydratedDocument<IUser> & { _id: Types.ObjectId }`. More keystrokes per model, but downstream code is fully typed.

### D28. Photos in seed use `res.cloudinary.com/demo/...` placeholder URLs

The HTTPS validator accepts them, the `LotCard` will happily render them, and we don't need a real Cloudinary account to demo browse/detail. Real signed direct uploads land in step 5.

---

## Step 4 — API auth flow (`apps/api`)

### D30. Env loaded via `node --env-file` / `tsx --env-file`, not `dotenv`

Node 20+ ships `--env-file` natively; tsx 4 forwards it. Scripts read `--env-file=../../.env`, so the root `.env` is the single source of truth and we avoid a dotenv runtime dependency. The `.env` file must exist (copy from `.env.example`); the README will say so.

### D31. JWT in httpOnly cookie + `@fastify/jwt` `cookie` option

`@fastify/jwt` is configured with `cookie: { cookieName: env.JWT_COOKIE_NAME, signed: false }`, so `request.jwtVerify()` reads either the `Authorization` header or the cookie. Cookies are `sameSite: 'lax'`, `secure` only in production, `httpOnly: true`, 30 days. Reading from the cookie is what lets Next.js server components authenticate without forwarding headers.

### D32. CORS allowlists `WEB_ORIGIN` with credentials

In dev, web (`:3000`) and api (`:4000`) are different origins, so we still need explicit CORS even though we're "same-site" in prod. `credentials: true` lets the cookie flow.

### D33. Per-phone OTP rate limit lives in Redis, not in `@fastify/rate-limit`

The global rate limiter keys on IP. OTP send is keyed on `phone` because a single IP could legitimately host many users (shared NAT in rural India). Implemented as a Redis `INCR` + `EXPIRE` against `otp:rate:{phone}`, max 5 per hour. The route also has a softer IP cap (10/min) from the standard limiter to absorb runaway clients.

### D34. OTP dev bypass: literal "123456" always accepted when `OTP_DEV_BYPASS=true`

`verifyOtp` short-circuits to `true` whenever the env flag is on and the OTP is `"123456"`. The real OTP is also stored and accepted, so end-to-end tests can opt out of the bypass by typing the logged code. The bypass is on by default — turn off only when wiring real Twilio Verify.

### D35. First OTP verify requires a `role`

`POST /auth/otp/verify { phone, otp, role? }`: if the phone has no user yet, `role` must be provided to materialize the user shell. The frontend picks the role on signup before the OTP screen.

### D36. Uniform `{ ok, data | error }` envelope via `ok()` / `fail()` helpers

Every route returns through these helpers so the shape stays consistent. The error handler plugin also routes uncaught `ValidationError`s through `fail()`. The Zod `parseOrThrow` wrapper turns Zod issues into `400` validation errors with field-level `details`.

---

## Step 5 — lots / inquiries / prices / transactions / admin (`apps/api`)

### D39. Lot list defaults to `status: 'active'`, accepts `status=` override

Browse should show buyable inventory by default. Pass `?status=draft` to inspect your own drafts via `/lots/mine` (which filters by ownership anyway).

### D40. Geospatial filter uses `$geoWithin + $centerSphere`, not `$near`

`$near` requires a `2dsphere` index AND can't be combined with `$or`/skip in a few Mongo versions, which breaks pagination + filtering. `$geoWithin` works inside any compound `find`, so we use it with the `radius_km / earth_radius_km` formula. Default radius when `near_lat`/`near_lng` are passed without `radius_km`: 50 km.

### D41. `view_count` and `inquiry_count` increments are fire-and-forget

We don't `await` them. The product is OK with a small under-count in the worst case; what we save is a round-trip on the hot path. Errors are logged via `app.log.warn`.

### D42. Photos on `POST /lots/:id/photos` are appended, capped at 5

Server takes the existing `lot.photos`, concatenates new URLs, then slices to 5. Lets the multi-step form upload in batches.

### D43. 24h inquiry dedupe via index scan, not unique constraint

`InquiryModel.findOne({ buyer_id, lot_id, created_at: $gte: now-24h })` against the compound index `(buyer_id, lot_id, created_at desc)`. A unique constraint would prevent re-inquiry forever; the time window is the actual business rule.

### D44. Recording a transaction moves the lot's `status`

`status='agreed'` → lot becomes `reserved`. `status='shipped'|'delivered'` → lot becomes `sold`. Keeps the marketplace state machine consistent without a separate "mark sold" route.

### D45. Cloudinary signing endpoint returns full params, not just signature

`POST /lots/photos/sign` returns `{ timestamp, folder, signature, api_key, cloud_name }`. Browser plugs the whole object into the Cloudinary upload form without ever seeing the API secret.

### D46. Admin routes share a single role gate via `addHook('preHandler', requireRole('admin'))`

One line guards the whole namespace. Per-route preHandlers would duplicate the check on every admin endpoint.

### D48. Web reads root `.env` via an inline loader in `next.config.mjs`

`next dev` only looks at app-local `.env` files. To keep one root `.env` as the source of truth, `apps/web/next.config.mjs` reads `../../.env` (if present) at config time and stamps the variables into `process.env`. Saves a per-app `.env` duplicate and avoids a dotenv-cli dev dependency.

### D49. Relative imports inside packages consumed by Next don't use `.js` extensions

Next's webpack resolver doesn't substitute `.js` → `.ts` when transpiling `packages/ui` and other workspace packages. So `packages/ui/src/index.ts` imports as `'./cn'` (no extension). For packages only consumed by `tsx` / Node (`@anaaj/db`, internal API code, internal `@anaaj/types`), `.js` extensions stay. The split mirrors what the tooling actually understands.

### D50. Pages live under `app/(public)/` and the (public) layout adds nav + footer

Route groups (`(public)`, `(auth)`, `(app)`, `(admin)`) keep URLs flat but let each section share its own chrome. Step-1 placeholder `app/page.tsx` was removed and replaced with `app/(public)/page.tsx`.

### D51. WhatsApp button is rendered as "Sign in to connect" until auth lands

`apps/web/components/WhatsAppButton.tsx` is a client component that checks an `authed` prop set by the SSR cookie-presence check. Until step 7 wires the cookie through the web's `/api` proxy, the dev cookie sits on `:4000` only, so step 6 always shows the signed-out fallback. That's the desired behavior — clicking it takes the buyer to `/login` (still to be built).

### D47. `/admin/prices` upserts on the `(mandi, variety, date)` unique key

Re-posting the same combination overwrites yesterday's value rather than throwing a duplicate-key error. After write, the redis cache key for that date is invalidated so the next `/prices/today` is a fresh DB read.

### D38. UTC-midnight for `PriceTick.date` + `/prices/today` filter

Seed inserts ticks at `today.setUTCHours(0,0,0,0)`; the route filters `date >= UTC midnight today`. The host is in IST (UTC+5:30), so a naive local-midnight seed produced rows dated 5h30 before UTC midnight and `/prices/today` returned `[]`. Switching to UTC for both makes the comparison correct regardless of host timezone, and matches how the Redis cache key (`prices:today:YYYY-MM-DD` in UTC) is keyed.

### D37. `request.user.sub` is the stringified Mongo `_id`

Cookie payload is `{ sub, role, phone }`. We never trust the `role` value blindly when it matters — admin routes re-check against the DB. But for cheap reads like `/me`, the JWT claim is enough.
