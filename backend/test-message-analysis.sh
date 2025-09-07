#!/bin/bash

# Teste de Extração de Dados da Mensagem
echo "🧪 Testando extração de dados da mensagem..."

BASE_URL="http://localhost:3000"

echo "📤 Teste: Mensagem multilinhas com Service leo_19_PING"
curl -X POST "$BASE_URL/notifications/checkcle-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Alert\nService leo_19_PING is DOWN.\nType PING\nStatus: DOWN",
    "notify_name": "www",
    "timestamp": "2025-09-06T15:49:47Z"
  }' \
  --verbose

echo -e "\n\n📤 Teste 2: Mensagem com padrão diferente"
curl -X POST "$BASE_URL/notifications/checkcle-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "HTTP monitor for Service api_server_25_HTTP is DOWN. Status: FAILED, Response time: 5000ms",
    "notify_name": "random_name",
    "timestamp": "2025-09-06T16:00:00Z"
  }' \
  --verbose

echo -e "\n\n✅ Testes enviados! Verifique os logs do servidor para ver a análise da mensagem."
