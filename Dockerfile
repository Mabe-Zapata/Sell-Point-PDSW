# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Deps layer — cached unless package*.json changes
# We need devDependencies here (@nestjs/cli) for the build
COPY package*.json tsconfig*.json nest-cli.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Source layer — invalidated only when src actually changes
COPY src/ ./src/

RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:22-alpine AS production

ARG UID=1001
ARG GID=1001

WORKDIR /app

RUN addgroup -g ${GID} -S nodejs && \
    adduser -S nestjs -u ${UID}

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/src/infrastructure/email/templates ./src/infrastructure/email/templates

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_TYPE=postgres

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/docs || exit 1

CMD ["node", "dist/main.js"]
