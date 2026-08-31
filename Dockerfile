FROM node:20-alpine AS builder
WORKDIR /app

# prisma.config.ts goi env("DATABASE_URL") va nem loi neu bien khong resolve duoc.
# Luc build image thi chua co bien that, nen dat gia tri gia cho cac lenh build.
# Chi dung inline de gia tri nay khong dinh vao image.
ARG BUILD_DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY package*.json ./
RUN DATABASE_URL="$BUILD_DATABASE_URL" npm ci

COPY . .
# Sinh Prisma Client roi moi compile TypeScript (code import tu @prisma/client).
# prisma generate chi doc schema, khong ket noi DB nen URL gia la du.
RUN DATABASE_URL="$BUILD_DATABASE_URL" npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

ARG BUILD_DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY package*.json ./
RUN DATABASE_URL="$BUILD_DATABASE_URL" npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Prisma 7 doc DATABASE_URL tu prisma.config.ts, khong phai tu schema.prisma.
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Dung lai client da generate o builder de khong phai generate lai luc chay.
# @prisma/client chi la lop vo re-export tu .prisma/client, phai copy ca hai;
# thieu .prisma thi container chet ngay voi loi "did not initialize yet".
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000

# Chay migration truoc khi start de DB luon khop schema hien tai.
# Luc nay DATABASE_URL that da co tu bien moi truong cua platform.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
