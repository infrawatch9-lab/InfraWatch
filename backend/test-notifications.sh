#!/bin/bash

# Script de teste para o sistema de notificações
# Para testar as novas APIs de notificações

echo "🧪 Testando Sistema de Notificações do InfraWatch"
echo "=================================================="

# Configurações
BASE_URL="http://localhost:3000"
TOKEN=""  # Substitua pelo token JWT válido

# Função para fazer requests autenticados
request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint"
    else
        curl -s -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint"
    fi
}

echo
echo "📝 1. Buscar todas as notificações (primeira página)"
echo "---------------------------------------------------"
response=$(request GET "/notifications?page=1&limit=10")
echo $response | jq '.'

echo
echo "📊 2. Contar notificações não lidas"
echo "-----------------------------------"
response=$(request GET "/notifications/unread-count")
echo $response | jq '.'

echo
echo "🔍 3. Buscar apenas notificações não lidas"
echo "------------------------------------------"
response=$(request GET "/notifications?unreadOnly=true&limit=5")
echo $response | jq '.'

echo
echo "✅ 4. Marcar notificação como lida (ID: 1)"
echo "-----------------------------------------"
response=$(request POST "/notifications/1/mark-read")
echo $response | jq '.'

echo
echo "✅ 5. Marcar todas as notificações como lidas"
echo "---------------------------------------------"
response=$(request POST "/notifications/mark-all-read")
echo $response | jq '.'

echo
echo "🆕 6. Criar nova notificação de teste"
echo "-------------------------------------"
new_notification='{
  "userId": 1,
  "message": "Teste de notificação criada via API",
  "type": "EMAIL",
  "channel": "EMAIL"
}'
response=$(request POST "/notifications" "$new_notification")
echo $response | jq '.'

echo
echo "📈 7. Verificar contagem após os testes"
echo "---------------------------------------"
response=$(request GET "/notifications/unread-count")
echo $response | jq '.'

echo
echo "🎯 8. Buscar todas as notificações novamente para verificar mudanças"
echo "--------------------------------------------------------------------"
response=$(request GET "/notifications?page=1&limit=10")
echo $response | jq '.'

echo
echo "✅ Testes concluídos!"
echo
echo "💡 Dicas para usar as APIs:"
echo "  - GET /notifications - Lista todas as notificações com paginação"
echo "  - GET /notifications?unreadOnly=true - Lista apenas não lidas"
echo "  - GET /notifications/unread-count - Conta notificações não lidas"
echo "  - POST /notifications/:id/mark-read - Marca uma específica como lida"
echo "  - POST /notifications/mark-all-read - Marca todas como lidas"
echo "  - POST /notifications - Cria nova notificação"
echo
echo "🔗 Documentação completa disponível em: $BASE_URL/api-docs"
