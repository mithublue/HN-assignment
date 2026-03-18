# =============================================================================
# Multi-stage Dockerfile for Next.js Hacker News Reader
# =============================================================================
# Stage 1 (base)   — shared Node 20 Alpine base
# Stage 2 (deps)   — install all npm dependencies
# Stage 3 (builder)— generate Prisma client + build Next.js
# Stage 4 (runner) — minimal production image
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 3: Builder
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (outputs to ./generated/prisma as per schema.prisma)
RUN npx prisma generate

# Build Next.js standalone output
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 4: Runner
# -----------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone server + static assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema (needed by `prisma db push` at startup)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Generated Prisma client (used by the app at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated

# Prisma runtime engine + adapter (required by PrismaClient)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/adapter-mariadb ./node_modules/@prisma/adapter-mariadb

# Prisma CLI binary (needed to run `prisma db push` at container startup)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# package.json is required by the Prisma CLI to locate the project root
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Startup:
# 1. Push schema to MySQL (creates/updates tables — safe to run on every start)
#    We pass DATABASE_URL directly via the environment set in docker-compose.yml
#    and skip prisma.config.ts (TypeScript, not available in runner) by using --schema flag.
# 2. Start the Next.js production server
CMD sh -c "node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --skip-generate && node server.js"
