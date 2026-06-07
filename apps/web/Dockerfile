FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY apps/web ./apps/web
RUN pnpm --filter @comfytag/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
# Copy ONLY the necessary files from builder's standalone output
# The standalone build outputs to /app/apps/web/.next/standalone/
# We need: server.js, package.json, node_modules/, public/, .next/static/
COPY --from=builder /app/apps/web/.next/standalone/server.js ./
COPY --from=builder /app/apps/web/.next/standalone/package.json ./
COPY --from=builder /app/apps/web/.next/standalone/package-lock.json* ./
COPY --from=builder /app/apps/web/.next/standalone/node_modules/ ./node_modules/
COPY --from=builder /app/apps/web/.next/static/ ./.next/static/
COPY --from=builder /app/apps/web/public/ ./public/
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
