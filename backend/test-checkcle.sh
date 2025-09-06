#!/bin/bash

echo "🧪 Teste do CheckcleAuthService"
echo "==============================="

# 1. Iniciar o servidor em background
echo "📌 Iniciando servidor..."
cd /home/gkomba/sgoinfre/InfraWatch/backend
npm run start:dev &
SERVER_PID=$!

# Aguardar o servidor iniciar
echo "⏳ Aguardando servidor iniciar (10 segundos)..."
sleep 10

# 2. Testar o endpoint
echo "🔍 Testando endpoint de login..."
curl -X POST http://localhost:3000/checkcle-auth/login \
  -H "Content-Type: application/json" \
  -w "\n📊 Status Code: %{http_code}\n"

# 3. Parar o servidor
echo "🛑 Parando servidor..."
kill $SERVER_PID

echo "✅ Teste concluído!"
echo "📋 Verifique os logs acima para ver se o token foi armazenado."
