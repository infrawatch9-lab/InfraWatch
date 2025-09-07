#!/bin/bash

# Script para testar o webhook do CheckCle
BASE_URL="http://localhost:3000"

echo "🧪 Testando webhook do CheckCle..."
echo "Base URL: $BASE_URL"

# Payload de teste no formato tokenizado
PAYLOAD='{
  "message": "INFO|API Gateway Service_20_HTTP|UP|HTTP|248ms|2025-09-07 17:02:50",
  "notify_name": "test-notification",
  "timestamp": "2025-09-07T17:02:50Z"
}'

echo ""
echo "📦 Payload de teste:"
echo "$PAYLOAD"

echo ""
echo "🚀 Enviando webhook..."

curl -v -X POST "$BASE_URL/api/notifications/checkcle-webhook" \
     -H "Content-Type: application/json" \
     -d "$PAYLOAD"

echo ""
echo ""
echo "✅ Teste de webhook concluído!"
echo ""
echo "💡 Para verificar os dados no banco:"
echo "   ./check-db.sh"
