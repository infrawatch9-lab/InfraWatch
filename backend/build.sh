#!/bin/bash

# Apagar build antigo
git pull

rm -rf ./build
echo "✅ Build antigo removido"

# Rodar novo build
npm install
npx prisma generate --schema=./prisma/schema.prisma
if npm run build; then
  echo "🎉 Novo build concluído com sucesso!"
  
  # Reiniciar app no PM2
  pm2 restart api
  
  # Mostrar logs
  pm2 logs api
else
  echo "❌ Erro no build. PM2 não será reiniciado."
fi

