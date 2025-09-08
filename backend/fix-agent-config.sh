#!/bin/bash

echo "🔍 Verificando arquivo de configuração do agente..."

echo ""
echo "📄 Conteúdo atual do config.json:"
echo "=================================="
cat /opt/infrawatch-agent/config.json

echo ""
echo "🔧 Validando JSON..."
python3 -m json.tool /opt/infrawatch-agent/config.json > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ JSON válido!"
else
    echo "❌ JSON inválido - corrigindo..."
    
    # Backup do arquivo original
    cp /opt/infrawatch-agent/config.json /opt/infrawatch-agent/config.json.backup
    
    echo ""
    echo "🛠️ Criando novo config.json válido..."
    cat > /opt/infrawatch-agent/config.json << 'EOF'
{
    "server_url": "https://infra42luanda.duckdns.org",
    "token": "TOKEN_PLACEHOLDER",
    "agent_id": "AGENT_ID_PLACEHOLDER",
    "interval": 60
}
EOF

    echo "✅ Novo config.json criado!"
    echo ""
    echo "⚠️  ATENÇÃO: Você precisa atualizar o token e agent_id"
fi

echo ""
echo "📝 Para corrigir manualmente:"
echo "1. Verifique o token e agent_id corretos"
echo "2. Edite: nano /opt/infrawatch-agent/config.json"
echo "3. Reinicie: systemctl restart infrawatch-agent"
