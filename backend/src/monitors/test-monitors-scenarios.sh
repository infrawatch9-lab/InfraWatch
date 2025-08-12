#!/bin/bash

echo "🎭 ===== CENÁRIOS DE TESTE: MonitorsController ====="
echo ""

BASE_URL="http://localhost:3042/api"

# Cenário 1: Teste de Conectividade
echo "🌐 Cenário 1: Teste de Conectividade"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Hosts válidos
curl -s -X POST "$BASE_URL/monitors/test/ping" \
     -H "Content-Type: application/json" \
     -d '{"hostname": "8.8.8.8", "timeout": 3000}' | jq '.'

# Host inválido
curl -s -X POST "$BASE_URL/monitors/test/ping" \
     -H "Content-Type: application/json" \
     -d '{"hostname": "host-inexistente-12345.com", "timeout": 3000}' | jq '.'

echo ""

# Cenário 2: Teste de APIs HTTP
echo "🔗 Cenário 2: Teste de APIs HTTP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# API pública válida
curl -s -X POST "$BASE_URL/monitors/test/webhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://jsonplaceholder.typicode.com/posts/1",
       "method": "GET",
       "expectedStatusCodes": [200]
     }' | jq '.'

# API com POST
curl -s -X POST "$BASE_URL/monitors/test/webhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://httpbin.org/post",
       "method": "POST",
       "body": "{\"test\": \"data\"}",
       "headers": {"Content-Type": "application/json"},
       "expectedStatusCodes": [200]
     }' | jq '.'

echo ""

# Cenário 3: Teste de Tolerância a Falhas
echo "💥 Cenário 3: Teste de Tolerância a Falhas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# URL inexistente
curl -s -X POST "$BASE_URL/monitors/test/webhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://site-que-nao-existe-12345.com",
       "method": "GET",
       "timeout": 2000
     }' | jq '.'

# Timeout muito baixo
curl -s -X POST "$BASE_URL/monitors/test/webhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://httpbin.org/delay/5",
       "method": "GET",
       "timeout": 1000
     }' | jq '.'

echo ""

# Cenário 4: Teste de Performance
echo "⚡ Cenário 4: Teste de Performance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Teste múltiplos endpoints simultaneamente
curl -s -X POST "$BASE_URL/monitors/test/multiple-http" \
     -H "Content-Type: application/json" \
     -d '{
       "endpoints": [
         {"url": "https://google.com"},
         {"url": "https://github.com"},
         {"url": "https://stackoverflow.com"},
         {"url": "https://jsonplaceholder.typicode.com/posts/1"},
         {"url": "https://httpbin.org/get"}
       ]
     }' | jq '.'

echo ""
echo "✅ Todos os cenários de teste foram executados!"