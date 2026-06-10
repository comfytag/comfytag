FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN npm config set fetch-timeout 900000 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-retries 5 && \
    npm install --omit=dev --legacy-peer-deps
COPY . .

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# 🛠️ THE FIX: Explicitly copy the entire templates directory (including partials/ and layouts/)
COPY --from=builder /app/utils/emailTemplates ./utils/emailTemplates

RUN chown -R apiuser:nodejs /app
USER apiuser
EXPOSE 4002
CMD ["node", "app.js"]