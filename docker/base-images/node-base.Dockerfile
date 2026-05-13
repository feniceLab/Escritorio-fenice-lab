# =============================================================================
# BASE NODE.JS 18 ALPINE - Multi-Stage Dockerfile
# =============================================================================
# Used as a shared base layer by GSD and AIOX services.
# To build: docker build -f docker/base-images/node-base.Dockerfile -t starken/node-base:18 .
#
# Two stages:
#   1. deps    - installs production dependencies with npm ci
#   2. runtime - lean final image, copies only what's needed
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: deps - dependency installation
# ---------------------------------------------------------------------------
FROM node:18-alpine AS deps

# Add OS-level packages needed for native Node addons (gyp, python, etc.)
# These are only present in the build stage and not in the final image.
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copy manifests first so Docker layer cache is reused when source changes
# but dependencies have not.
COPY package.json package-lock.json* ./

# --frozen-lockfile ensures the lock file is never silently updated
# BuildKit cache mount speeds up repeated builds by preserving npm cache on host
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: runtime - lean production image
# ---------------------------------------------------------------------------
FROM node:18-alpine AS runtime

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nodeapp

WORKDIR /app

# Set production environment for all downstream Dockerfiles that use this base
ENV NODE_ENV=production \
    # Disable npm update checks in production
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    # Ensure node finds modules even without node_modules at build root
    NODE_PATH=/app/node_modules

# Copy installed node_modules from the deps stage
COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules

# Downstream Dockerfiles add their own COPY for application source,
# EXPOSE for their port, and CMD / ENTRYPOINT.

USER nodeapp

# Default command - override in service-specific Dockerfiles
CMD ["node", "index.js"]
