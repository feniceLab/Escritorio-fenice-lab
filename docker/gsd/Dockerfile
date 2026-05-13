# =============================================================================
# GSD (get-shit-done) - Fixed Dockerfile for ASSESSORIA stack
# Wraps the original GSD build and adds missing package.json to runtime stage
# =============================================================================

# Stage 1: deps — install production dependencies only
FROM node:18-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --production

# Stage 2: runtime — lean production image
FROM node:18-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules

# Copy application source directories
COPY bin/ ./bin/
COPY get-shit-done/ ./get-shit-done/
COPY agents/ ./agents/
COPY commands/ ./commands/

# FIX: copy package.json so bin/install.js can require('../package.json')
COPY package.json ./

# Create persistent data directory
RUN mkdir -p /app/data

# Create and switch to non-root user
RUN addgroup -S gsdgroup && adduser -S gsduser -G gsdgroup
RUN chown -R gsduser:gsdgroup /app

# Pre-create ~/.claude directory tree that GSD installer expects
RUN mkdir -p /home/gsduser/.claude/commands \
    && chown -R gsduser:gsdgroup /home/gsduser/.claude

USER gsduser

ENTRYPOINT ["node"]
CMD ["bin/install.js"]
