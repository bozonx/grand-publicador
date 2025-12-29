ARG NODE_MAJOR=22
FROM node:${NODE_MAJOR}-alpine

# Install dependencies for Prisma and other tools
RUN apk add --no-cache openssl build-base

WORKDIR /app

ENV NODE_ENV=production
ENV LISTEN_HOST=0.0.0.0
ENV LISTEN_PORT=8080
ENV TZ=UTC
ENV LOG_LEVEL=warn

# Install pnpm
RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./
# Also need ui package.json if we want to run anything, but maybe not necessary for runtime
# However, we need dependencies for prisma and the app itself

# Install dependencies
RUN pnpm install --prod --frozen-lockfile --prefer-offline || pnpm install --prod --prefer-offline

# Copy pre-built backend application
COPY dist ./dist

# Copy pre-built frontend application
COPY ui/.output ./ui/.output

# Copy prisma schema, migrations and config
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Generate prisma client inside container to ensure architecture compatibility
RUN npx prisma generate

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
