# =============================================================================
# awaremagnus Dockerfile
# Next.js 15 | TypeScript | Port 8001 | basePath: /awm
#
# CRITICAL — NEXT_PUBLIC_* variables are embedded at BUILD TIME by Next.js.
# They are compiled into the JavaScript bundle and cannot be changed at
# runtime without rebuilding the image. This is a Next.js framework constraint,
# not a Docker limitation.
#
# Environment strategy per deployment target:
#   - Testing / local dev : pass --build-arg with localhost or server IP
#   - UAT                  : rebuild with UAT domain as build-args
#   - Production           : rebuild with production domain as build-args
#
# How to supply them:
#   Option A — docker-compose build-args (see docker-compose.yml):
#     NEXT_PUBLIC_SERVICE_AWM_URL, NEXT_PUBLIC_SERVICE_SUITE_URL,
#     NEXT_PUBLIC_SUITE_WEBAPP_URL read from host env or root .env file
#
#   Option B — direct build (override per-environment):
#     docker build \
#       --build-arg NEXT_PUBLIC_SERVICE_AWM_URL=https://awm-api.example.com \
#       --build-arg NEXT_PUBLIC_SERVICE_SUITE_URL=https://api.example.com \
#       --build-arg NEXT_PUBLIC_SUITE_WEBAPP_URL=https://app.example.com \
#       -t secure_magnus/awaremagnus:latest .
#
# WHY node:20-alpine:
#   Next.js has no native C addons. Alpine produces a much smaller image
#   (~100 MB lighter) than Debian slim with no trade-offs for a pure-JS app.
# =============================================================================

# =============================================================================
# Stage 1 — deps
# Install ALL dependencies (including devDependencies) because webpack-obfuscator
# is in devDependencies but imported in next.config.js during `next build`.
#
# WHY npm install instead of npm ci:
#   The package-lock.json has a version drift on transitive deps caused by the
#   `overrides` section in package.json (e.g. @internationalized/date pinning).
#   npm ci is strict and refuses to proceed when lock file and package.json
#   diverge. npm install resolves deps fresh from package.json, which is correct
#   for the build stage. The production stage still uses npm ci --omit=dev
#   because production deps are stable and the lock file matches them.
# =============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm install

# =============================================================================
# Stage 2 — builder
# Build the Next.js application with the correct NEXT_PUBLIC_* variables baked in.
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Receive public URLs as build-time arguments.
# Defaults are localhost — suitable for a developer running everything on one machine.
# Override with your server IP for testing, or domain for UAT/prod (see header).
ARG NEXT_PUBLIC_SERVICE_AWM_URL=http://localhost:3001
ARG NEXT_PUBLIC_SERVICE_SUITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_SUITE_WEBAPP_URL=http://localhost:8000

# Materialise the ARGs as ENV so Next.js picks them up during `next build`
ENV NEXT_PUBLIC_SERVICE_AWM_URL=$NEXT_PUBLIC_SERVICE_AWM_URL
ENV NEXT_PUBLIC_SERVICE_SUITE_URL=$NEXT_PUBLIC_SERVICE_SUITE_URL
ENV NEXT_PUBLIC_SUITE_WEBAPP_URL=$NEXT_PUBLIC_SUITE_WEBAPP_URL

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# =============================================================================
# Stage 3 — production
#
# WHY this stage is tiny:
#   output: "standalone" in next.config.js instructs Next.js to emit a
#   self-contained server at .next/standalone/server.js that already includes
#   only the node_modules it actually imports — no full node_modules install
#   needed here. Combined with Alpine, this drops the image from ~3.6 GB to
#   roughly 300-400 MB.
#
# What gets copied:
#   .next/standalone/  → minimal Node server + tree-shaken node_modules
#   .next/static/      → hashed JS/CSS chunks (served by the standalone server)
#   public/            → static assets (fonts, images, etc.)
# =============================================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Standalone server reads PORT and HOSTNAME from environment
ENV PORT=8001
ENV HOSTNAME=0.0.0.0

# Copy the self-contained standalone server (includes its own trimmed node_modules)
COPY --from=builder --chown=node:node /app/.next/standalone ./
# Static assets must sit at .next/static relative to the server
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# Public directory for fonts, images, favicon etc.
COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir -p /app/logs

USER node

EXPOSE 8001

# basePath is /awm — healthcheck must hit that path
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=3 \
    CMD curl -fsS http://localhost:8001/awm || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
# standalone output replaced `next start` with a plain node server.js
CMD ["node", "server.js"]
