FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/partner/package.json ./apps/partner/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY apps/partner ./apps/partner
RUN pnpm --filter @comfytag/partner build

FROM base AS runner
WORKDIR /app/apps/partner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/partner/.next ./.next
COPY --from=builder /app/apps/partner/public ./public
COPY --from=builder /app/apps/partner/package.json ./package.json
COPY --from=builder /app/package.json /app/package.json
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
CMD ["node", "/app/node_modules/next/dist/bin/next", "start"]
