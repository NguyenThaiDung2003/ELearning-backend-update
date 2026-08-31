FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Sinh Prisma Client roi moi compile TypeScript (code import tu @prisma/client).
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Prisma 7 doc DATABASE_URL tu prisma.config.ts, khong phai tu schema.prisma.
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Dung lai client da generate o builder de khong can DATABASE_URL luc build image.
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 5000

# Chay migration truoc khi start de DB luon khop schema hien tai.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
