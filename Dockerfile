FROM node:22-alpine AS builder
WORKDIR /app

# better-sqlite3 prebuilt binaries work on Alpine; fallback needs build tools
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini

# Copy built output + production deps (better-sqlite3 native addon included)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Persistent data volume for SQLite
RUN mkdir -p /data
VOLUME /data

ENV HOST=0.0.0.0
ENV PORT=4321
ENV DATA_DIR=/data
ENV NODE_ENV=production

EXPOSE 4321

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server/entry.mjs"]
