FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV BETTER_AUTH_SECRET=build-time-placeholder-not-used-at-runtime
ENV BETTER_AUTH_URL=http://localhost:3000
RUN pnpm exec prisma generate && pnpm build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
