# =============================================================================
# Multi-stage Dockerfile for Next.js Hacker News Reader
# =============================================================================
# This Dockerfile uses a multi-stage build approach to create an optimized
# production image. It includes Prisma ORM setup and Next.js build process.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base Image
# -----------------------------------------------------------------------------
# Use Node.js 20 Alpine as the base image for all stages
# Alpine is chosen for its small size (~5MB vs ~900MB for full Node image)
FROM node:20-alpine AS base

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
# Install all dependencies needed for building the application
FROM base AS deps

# Install libc6-compat for compatibility with some npm packages on Alpine
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
# Copying only package files first allows Docker to cache this layer
# if dependencies haven't changed, speeding up subsequent builds
COPY package*.json ./

# Install dependencies using npm ci (clean install)
# npm ci is faster and more reliable than npm install for CI/CD
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 3: Builder
# -----------------------------------------------------------------------------
# Build the Next.js application and generate Prisma client
FROM base AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Generate Prisma Client
# This creates the type-safe database client based on schema.prisma
# The generated client will be in ./generated/prisma/ as per our schema config
RUN npx prisma generate

# Build Next.js application
# This creates an optimized production build in .next directory
# The build includes:
# - Server-side rendering (SSR) code
# - Static pages
# - API routes
# - Client-side JavaScript bundles
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 4: Production Runner
# -----------------------------------------------------------------------------
# Create the final production image with only necessary files
FROM base AS runner

WORKDIR /app

# Set Node environment to production
# This optimizes Node.js for production (e.g., disables dev warnings)
ENV NODE_ENV=production

# Create a non-root user for security
# Running as non-root reduces security risks
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
# Only copy what's needed to run the app, keeping image size small
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Switch to non-root user
USER nextjs

# Expose port 3000 for the Next.js application
EXPOSE 3000

# Set environment variables for Next.js server
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js production server
# This runs the standalone server created during build
CMD ["node", "server.js"]
