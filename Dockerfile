# ===== Build =====
FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm install

COPY backend/prisma ./prisma

RUN npx prisma generate

COPY backend ./

RUN npm run build


# ===== Final =====
FROM node:20-alpine

WORKDIR /app/backend

COPY --from=builder /app/backend ./

ENV NODE_ENV=production

RUN npm ci --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start"]
