# ===== Build =====
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm install

COPY backend ./ 

RUN npm run build
RUN npm prune --production


# ===== Imagem final =====
FROM node:20-alpine

WORKDIR /app/backend


COPY --from=builder /app/backend ./

RUN npm install -g nodemon

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
