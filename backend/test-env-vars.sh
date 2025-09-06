#!/bin/bash

echo "🔍 Verificando variáveis de ambiente do CheckCle..."
echo ""

# Verificar se o arquivo .env existe
if [ -f ".env" ]; then
    echo "✅ Arquivo .env encontrado"
    echo ""
    
    echo "📋 Conteúdo das variáveis CheckCle no .env:"
    grep -E "(TEMPLATE_ID|NOTIFICATION_ID)" .env
    echo ""
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

# Verificar se o Node.js consegue ler as variáveis
echo "🔍 Testando leitura das variáveis pelo Node.js..."

cat > test_env.js << 'EOF'
require('dotenv').config();

console.log('TEMPLATE_ID:', process.env.TEMPLATE_ID || 'UNDEFINED');
console.log('NOTIFICATION_ID:', process.env.NOTIFICATION_ID || 'UNDEFINED');

const templateId = process.env.TEMPLATE_ID || "88ydacw6t6j34mi";
const notificationId = process.env.NOTIFICATION_ID || "5pq81fx31h9e3yg";

console.log('\nValores finais que serão usados:');
console.log('template_id:', templateId);
console.log('notification_id:', notificationId);

// Cleanup
process.exit(0);
EOF

node test_env.js
rm test_env.js

echo ""
echo "✅ Teste concluído!"
