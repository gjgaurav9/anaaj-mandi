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
