#!/bin/bash

echo "🚀 Testando sistema de notificações..."

# 1. Testar webhook
echo ""
echo "1️⃣ Testando webhook..."
./test-webhook.sh

# 2. Aguardar um pouco
echo ""
echo "⏳ Aguardando processamento..."
sleep 2

# 3. Verificar banco
echo ""
echo "2️⃣ Verificando banco de dados..."
./check-db.sh

# 4. Verificar serviços
echo ""
echo "3️⃣ Verificando serviços..."
./check-services.sh

echo ""
echo "✅ Debug completo concluído!"
