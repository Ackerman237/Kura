# ==============================================================================
# Kura (蔵) — Production Multi-Stage Dockerfile
# Stage 1: Build Frontend (Vite + Vue 3)
# Stage 2: Production Lightweight Node.js Runtime
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first for efficient Docker layer caching
COPY package*.json ./

RUN npm ci

# Copy source code and build frontend bundle
COPY . .
RUN npm run build:web

# ------------------------------------------------------------------------------
# Stage 2: Runner Stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install curl for DoH fallback in image proxy and player frame routes
RUN apk add --no-cache curl

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source & built frontend assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js

# Switch to non-root user for security
USER node

EXPOSE 4000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "server.js"]
