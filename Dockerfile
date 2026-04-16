FROM node:22-alpine AS builder
WORKDIR /app

# better-sqlite3 prebuilt binaries work on Alpine; fallback needs build tools
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# --- Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini wget \
    && addgroup -S app \
    && adduser -S -G app -H -h /app app

COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./

RUN mkdir -p /data && chown -R app:app /data
VOLUME /data

ENV HOST=0.0.0.0
ENV PORT=4321
ENV DATA_DIR=/data
ENV NODE_ENV=production

EXPOSE 4321

USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:4321/api/health >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server/entry.mjs"]
