FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json yarn.lock ./ 
RUN yarn install --frozen-lockfile --registry=https://registry.npmmirror.com

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . . 
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./ 
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p ./.next/cache && chown -R nextjs:nodejs ./.next

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
