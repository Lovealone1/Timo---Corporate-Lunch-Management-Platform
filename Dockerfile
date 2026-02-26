FROM node:22-slim AS base

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files and lockfile
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema before installing dependencies
# because "pnpm install" triggers "prisma generate" in postinstall
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install all dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# Copy everything else
COPY . .

# Build NestJS app
RUN pnpm run build

# Start the application
CMD [ "sh", "-c", "npx prisma migrate deploy && pnpm run start:prod" ]
