# Etapa 1: Build da aplicação
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# Etapa 2: Imagem de produção
FROM node:18-slim
# Instala o servidor 'serve'
RUN npm install -g serve
WORKDIR /app
# Copia os arquivos estáticos do build
COPY --from=build /app/build ./build
# Porta exposta
EXPOSE 3000
# Comando de inicialização
CMD ["serve", "-s", "build", "-l", "3000"]