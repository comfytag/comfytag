FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .
RUN chown -R apiuser:nodejs /app
USER apiuser
EXPOSE 4002
CMD ["node", "app.js"]
