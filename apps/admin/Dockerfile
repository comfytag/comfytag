FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/admin/package.json ./apps/admin/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY apps/admin ./apps/admin
RUN pnpm --filter @comfytag/admin build

FROM base AS runner
WORKDIR /app/apps/admin
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/admin/.next ./.next
COPY --from=builder /app/apps/admin/public ./public
COPY --from=builder /app/apps/admin/package.json ./package.json
COPY --from=builder /app/package.json /app/package.json
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"
CMD ["node", "/app/node_modules/next/dist/bin/next", "start"]
