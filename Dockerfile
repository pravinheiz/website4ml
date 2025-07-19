# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

# Build the client
FROM base AS client-builder
WORKDIR /app
COPY client ./client
COPY --from=deps /app/client/node_modules ./client/node_modules
WORKDIR /app/client
RUN npm run build

# Build the server
FROM base AS server-builder
WORKDIR /app
COPY server ./server
COPY --from=deps /app/server/node_modules ./server/node_modules
WORKDIR /app/server
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server/package.json ./server/

USER nextjs

EXPOSE 4000

ENV PORT 4000

CMD ["node", "server/dist/app.js"]