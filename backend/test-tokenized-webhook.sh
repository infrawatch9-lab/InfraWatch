#!/bin/bash

echo "🧪 Testando o novo formato de payload tokenizado..."
echo ""

# Teste com diferentes tipos de payload
echo "📝 Teste 1: Serviço UP"
curl -X POST http://localhost:3000/notifications/checkcle-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-09-07T17:02:50Z",
    "message": "INFO|API Gateway Service_20_HTTP|UP|HTTP|248ms|2025-09-07 17:02:50",
    "notify_name": "test_webhook"
  }'

echo ""
echo ""

echo "📝 Teste 2: Serviço DOWN"
curl -X POST http://localhost:3000/notifications/checkcle-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-09-07T17:05:30Z",
    "message": "ALERT|Database Server_15_PING|DOWN|PING|0ms|2025-09-07 17:05:30",
    "notify_name": "db_alert"
  }'

echo ""
echo ""

echo "📝 Teste 3: Formato incompleto (deve usar fallback)"
curl -X POST http://localhost:3000/notifications/checkcle-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-09-07T17:08:15Z",
    "message": "Service leo_19_PING is DOWN.\nType PING\nStatus: DOWN",
    "notify_name": "legacy_format"
  }'

echo ""
echo "✅ Testes concluídos!"
