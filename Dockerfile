# ─────────────────────────────────────────────────────────────
# MCU Faculty System — Hardened Production Dockerfile
# Multi-stage, Minimal Alpine, Non-root Execution
# ─────────────────────────────────────────────────────────────

# 1. Dependencies Stage
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts || npm install --omit=dev

# 2. Builder Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 3. Production Runner Stage (Minimal, Non-root, Read-only system protected)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install dumb-init for clean process reaping and signal handling (anti-zombie processes)
RUN apk add --no-cache dumb-init

# Security: Create non-root system user and group (UID 1001, GID 1001)
# Attacker cannot escalate privileges, install packages, or hijack OS
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set up runtime directories and ownership
RUN mkdir -p /app/data /app/.next && \
    chown -R nextjs:nodejs /app

# Copy built artifacts from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure data directory has proper read/write ownership for the non-root user
RUN chown -R nextjs:nodejs /app/data

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Run with dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
