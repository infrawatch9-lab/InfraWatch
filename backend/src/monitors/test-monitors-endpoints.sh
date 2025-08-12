#!/bin/bash

echo "🧪 ===== TESTE COMPLETO: MonitorsController Endpoints (COM AUTENTICAÇÃO) ====="
echo ""

BASE_URL="http://localhost:3042/api"

# Primeiro, fazer login para obter o token
echo "🔐 Fazendo login para obter token JWT..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/users/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "gkombadev@gmail.com",
       "password": "string"
     }')

# Extrair o token da resposta
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken' 2>/dev/null)

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Erro: Não foi possível obter token de acesso"
    echo "📄 Resposta do login:"
    echo $LOGIN_RESPONSE | jq '.' 2>/dev/null || echo $LOGIN_RESPONSE
    echo ""
    echo "💡 Certifique-se de que:"
    echo "   1. O servidor está rodando em http://localhost:3042"
    echo "   2. Existe um usuário com email 'admin@infrawatch.com' e senha 'admin123'"
    echo "   3. Ou ajuste as credenciais no script"
    exit 1
fi

echo "✅ Token obtido com sucesso!"
echo "🔑 Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Função para fazer requisições autenticadas
make_authenticated_request() {
    echo "🔄 Testando: $1"
    echo "📡 $2 $3"
    if [ "$4" != "" ]; then
        echo "📄 Body: $4"
    fi
    echo ""
    
    if [ "$4" != "" ]; then
        curl -s -X "$2" "$BASE_URL$3" \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $ACCESS_TOKEN" \
             -d "$4" | jq '.' 2>/dev/null || echo "Erro no parse JSON"
    else
        curl -s -X "$2" "$BASE_URL$3" \
             -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.' 2>/dev/null || echo "Erro no parse JSON"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# 1. Health Check do Sistema de Monitoramento
make_authenticated_request "Health Check" "GET" "/monitors/health"

# 2. Estatísticas dos Monitores
make_authenticated_request "Estatísticas dos Monitores" "GET" "/monitors/stats"

# 3. Monitores Ativos
make_authenticated_request "Listar Monitores Ativos" "GET" "/monitors/active"

# 4. Teste de Ping Manual
make_authenticated_request "Teste de Ping Manual" "POST" "/monitors/test/ping" '{
  "hostname": "8.8.8.8",
  "timeout": 5000
}'

# 5. Teste de Múltiplos Hosts
make_authenticated_request "Teste Múltiplos Hosts" "POST" "/monitors/test/multiple" '{
  "hosts": ["8.8.8.8", "1.1.1.1", "google.com"]
}'

# 6. Teste de Webhook
make_authenticated_request "Teste de Webhook" "POST" "/monitors/test/webhook" '{
  "url": "https://httpbin.org/get",
  "method": "GET",
  "timeout": 5000,
  "expectedStatusCodes": [200]
}'

# 7. Teste Múltiplos HTTP
make_authenticated_request "Teste Múltiplos HTTP" "POST" "/monitors/test/multiple-http" '{
  "endpoints": [
    {"url": "https://httpbin.org/get", "method": "GET", "expectedStatus": 200},
    {"url": "https://google.com", "method": "GET", "expectedStatus": 200},
    {"url": "https://github.com", "method": "GET", "expectedStatus": 200}
  ]
}'

# 8. Teste de Serviço (simulado)
make_authenticated_request "Teste de Serviço" "POST" "/monitors/test/service/1"

# 9. Controle de Monitoramento - Iniciar
make_authenticated_request "Iniciar Monitoramento" "POST" "/monitors/start/1"

# 10. Status do Monitor de um Serviço
make_authenticated_request "Status do Monitor" "GET" "/monitors/service/1/status"

# 11. Controle de Monitoramento - Parar
make_authenticated_request "Parar Monitoramento" "POST" "/monitors/stop/1"

# 12. Controle de Monitoramento - Reiniciar
make_authenticated_request "Reiniciar Monitoramento" "POST" "/monitors/restart/1"

# 13. Teste SSL (requer serviço existente)
make_authenticated_request "Teste SSL" "POST" "/monitors/test/ssl/1"

# 14. Limpeza de Métricas
make_authenticated_request "Limpeza de Métricas" "POST" "/monitors/cleanup/metrics" '{
  "days": 30
}'

# 15. Recarregar Monitores
make_authenticated_request "Recarregar Monitores" "POST" "/monitors/reload"

echo "✅ ===== TESTE COMPLETO FINALIZADO ====="
echo ""
echo "📋 Resumo dos Endpoints Testados:"
echo "   ✅ GET  /monitors/health"
echo "   ✅ GET  /monitors/stats"
echo "   ✅ GET  /monitors/active"
echo "   ✅ GET  /monitors/service/:id/status"
echo "   ✅ POST /monitors/test/ping"
echo "   ✅ POST /monitors/test/multiple"
echo "   ✅ POST /monitors/test/webhook"
echo "   ✅ POST /monitors/test/multiple-http"
echo "   ✅ POST /monitors/test/service/:id"
echo "   ✅ POST /monitors/test/ssl/:id"
echo "   ✅ POST /monitors/start/:id"
echo "   ✅ POST /monitors/stop/:id"
echo "   ✅ POST /monitors/restart/:id"
echo "   ✅ POST /monitors/cleanup/metrics"
echo "   ✅ POST /monitors/reload"
echo ""
echo "🎯 Total: 15 endpoints testados com autenticação"