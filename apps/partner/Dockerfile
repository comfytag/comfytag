FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/partner ./apps/partner
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
RUN pnpm --filter @comfytag/partner build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
# Copy the entire app directory from builder (includes all node_modules and built files)
COPY --from=builder /app .
RUN chown -R nextjs:nodejs /app
WORKDIR /app
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/partner/.next/standalone/server.js"]
