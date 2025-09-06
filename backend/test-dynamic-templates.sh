#!/bin/bash

# Teste do Sistema Dinâmico de Templates de Email
# Este script testa diferentes tipos de serviços e status

echo "🧪 Testando Sistema Dinâmico de Templates de Email..."

BASE_URL="http://localhost:3000"

# Teste 1: HTTP Service DOWN
echo "📤 Teste 1: HTTP Service DOWN"
curl -X POST "$BASE_URL/notifications/checkcle-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "HTTP monitor for API Google Service is DOWN. Status: DOWN, Response time: 5000ms",
    "notify_name": "API_Google_Service_http_19",
    "timestamp": "2025-09-06T14:30:00Z"
  }'

echo -e "\n\n"

# Teste 2: HTTP Service UP (Resolved)
echo "📤 Teste 2: HTTP Service UP (Resolved)"
curl -X POST "$BASE_URL/notifications/checkcle-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "HTTP monitor for API Google Service is UP. Status: UP, Response time: 250ms",
    "notify_name": "API_Google_Service_http_19",
    "timestamp": "2025-09-06T14:35:00Z"
  }'

echo -e "\n\n"

# Teste 3: PING Service DOWN
echo "📤 Teste 3: PING Service DOWN"
curl -X POST "$BASE_URL/notifications/checkcle-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "PING monitor for Server Production is DOWN. Status: FAILED, Response time: timeout",
    "notify_name": "Server_Production_ping_25",
    "timestamp": "2025-09-06T14:40:00Z"
  }'

echo -e "\n\n"

echo "✅ Testes enviados! Verifique os logs e emails para confirmar o uso dos templates dinâmicos."
echo ""
echo "📋 Templates esperados:"
echo "  - Teste 1: http-down.html (HTTP/DOWN)"
echo "  - Teste 2: http-up.html (HTTP/UP)"
echo "  - Teste 3: ping.html (PING/DOWN)"
