FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/partner ./apps/partner
RUN npm config set fetch-timeout 900000 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    pnpm install --frozen-lockfile

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

# 🛠️ THE FIX: Copy the static files into the standalone directory
RUN cp -r apps/partner/.next/static apps/partner/.next/standalone/apps/partner/.next/
RUN cp -r apps/partner/public apps/partner/.next/standalone/apps/partner/ 2>/dev/null || true

# Apply permissions AFTER copying so Next.js can read the files
RUN chown -R nextjs:nodejs /app
WORKDIR /app
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/partner/.next/standalone/apps/partner/server.js"]