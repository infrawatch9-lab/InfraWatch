# ===== Build =====
FROM node:20-alpine AS builder

WORKDIR /app

COPY Backend/package*.json ./Backend/

WORKDIR /app/Backend
RUN npm install

COPY Backend ./ 

RUN npm run build
RUN npm prune --production


# ===== Imagem final =====
FROM node:20-alpine

WORKDIR /app/Backend


COPY --from=builder /app/Backend ./

RUN npm install -g nodemon

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
