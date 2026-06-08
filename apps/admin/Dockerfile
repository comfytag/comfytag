FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/admin ./apps/admin
RUN echo "fetch-timeout=600000" > /root/.npmrc && \
    echo "fetch-retry-mintimeout=30000" >> /root/.npmrc && \
    echo "fetch-retry-maxtimeout=300000" >> /root/.npmrc && \
    pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
RUN pnpm --filter @comfytag/admin build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
# Copy the entire app directory from builder (includes all node_modules and built files)
COPY --from=builder /app .
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3002
ENV PORT=3002
CMD ["node", "apps/admin/.next/standalone/server.js"]
