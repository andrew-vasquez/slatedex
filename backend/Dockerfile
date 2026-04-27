FROM oven/bun:1.3.6 AS build

WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY scripts ./scripts

RUN mkdir -p src/generated && bun install --frozen-lockfile

COPY . .

RUN bun run build

EXPOSE 3001

CMD ["bun", "run", "start"]
