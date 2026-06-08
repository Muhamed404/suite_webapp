# =============================================================================
# suite_webapp Dockerfile
# Node.js 20 LTS | Express 4 | EJS | Redis sessions | Puppeteer (headless Chrome)
#
# WHY node:20-slim (Debian slim):
#   Alpine's chromium package tracks edge (Chromium 148+) and pulls in even
#   more dependencies than Debian Bookworm's pinned version — tested Alpine and
#   the apk layer came out at 784 MB vs Debian's 663 MB. Debian slim is smaller.
#
# Puppeteer strategy:
#   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true prevents Puppeteer from bundling its
#   own Chromium during `npm ci`. The system Chromium installed via apt is used
#   instead, pointed to via PUPPETEER_EXECUTABLE_PATH.
#
# Security note:
#   The container requires cap_add: [SYS_ADMIN] in docker-compose.yml for
#   Chromium's sandboxing syscalls (clone/unshare).
# =============================================================================

# =============================================================================
# Stage 1 — builder
# =============================================================================
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --omit=dev

# Strip source maps — separate layer so the npm ci cache above is not busted
# when this command changes.
RUN find /app/node_modules -name "*.map" -type f -delete

# =============================================================================
# Stage 2 — production
# =============================================================================
FROM node:20-slim AS production

WORKDIR /app

# Install Chromium and runtime deps, then delete files not needed for headless:
#   libVkLayer_khronos_validation.so  → Vulkan debug/validation layer  (~22 MB)
#   chrome_crashpad_handler           → crash reporting binary          (~ 3 MB)
#   libVkICD_mock_icd.so              → Vulkan mock ICD                 (~0.5 MB)
#   /usr/share/icons                  → GTK icon themes (Adwaita etc.)  (~20 MB)
#   /usr/share/doc                    → package documentation           (~ 5 MB)
#   /usr/share/man                    → man pages                       (~ 0.1 MB)
# All deletions are in the same RUN so they never form a separate layer.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    dumb-init \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f  /usr/lib/chromium/libVkLayer_khronos_validation.so \
              /usr/lib/chromium/chrome_crashpad_handler \
              /usr/lib/chromium/libVkICD_mock_icd.so \
    && rm -rf /usr/share/icons \
              /usr/share/doc \
              /usr/share/man

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

RUN chmod +x /app/docker-entrypoint.sh \
    && mkdir -p /app/logs /app/workspace /app/suite_keys \
    && chown node:node /app/logs /app/workspace /app/suite_keys

USER node

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/docker-entrypoint.sh"]
