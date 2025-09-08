#!/bin/bash

# Teste rápido via API para ver agentes e métricas
BASE_URL="https://infra42luanda.duckdns.org"

echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"vicor32leonel@gmail.com","password":"sua_senha"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$ACCESS_TOKEN" = "null" ]; then
  echo "❌ Erro no login"
  exit 1
fi

echo "✅ Login realizado!"

echo ""
echo "🤖 Agentes registrados:"
curl -s -X GET "$BASE_URL/agents" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo ""
echo "📊 Para ver métricas de um agente específico, use:"
echo "curl -X GET \"$BASE_URL/agents/{AGENT_ID}/metrics?hours=1\" -H \"Authorization: Bearer $ACCESS_TOKEN\""
