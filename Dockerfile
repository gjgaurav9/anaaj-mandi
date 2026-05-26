# syntax=docker/dockerfile:1.6
# Single-stage Dockerfile for apps/api running with tsx (no bundling step).
# Image size ≈ 350 MB which fits in Fly.io's 256 MB shared-cpu-1x VM with
# room to breathe. Switch to a pruned multi-stage build if the layer cache
# stops being useful.

FROM node:20-alpine

# Enable pnpm via corepack and pin the same version the workspace declares.
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

# Copy the workspace manifests first so pnpm install layers cache when
# only source changes. Listing each package.json explicitly avoids invalidating
# the install layer on every source edit.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json

# Install only what apps/api needs (the `...` includes its workspace deps).
RUN pnpm install --frozen-lockfile --filter @anaaj/api...

# Copy the actual source.
COPY tsconfig.base.json ./
COPY packages/tsconfig ./packages/tsconfig
COPY packages/types/src ./packages/types/src
COPY packages/types/tsconfig.json ./packages/types/tsconfig.json
COPY packages/db/src ./packages/db/src
COPY packages/db/tsconfig.json ./packages/db/tsconfig.json
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=4000

EXPOSE 4000

WORKDIR /app/apps/api
# tsx runs the .ts source directly — no separate build step.
# pnpm exec resolves the workspace-local tsx binary.
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
