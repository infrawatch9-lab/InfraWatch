#!/bin/bash

echo "🧪 ===== TESTE: Sistema de Senha Provisória ====="
echo ""

# 1. Registrar usuário com senha provisória
echo "1. 📝 Registrando usuário com senha provisória..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users/register-temp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "email": "maria.teste@example.com",
    "role": "USER"
  }')

echo "📄 Resposta do registro:"
echo $REGISTER_RESPONSE | jq '.' 2>/dev/null || echo $REGISTER_RESPONSE
echo ""

# Aguardar um pouco para simular o tempo
echo "⏳ Aguardando simulação de email..."
sleep 2
echo ""

# 2. Tentar login com senha incorreta
echo "2. ❌ Testando login com senha incorreta..."
LOGIN_FAIL=$(curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria.teste@example.com",
    "password": "senha_errada"
  }')

echo "📄 Resposta (deve falhar):"
echo $LOGIN_FAIL | jq '.' 2>/dev/null || echo $LOGIN_FAIL
echo ""

# 3. Login com senha provisória (simulada)
echo "3. ✅ Fazendo login com senha provisória (verificar logs do servidor)..."
echo "   💡 Use a senha provisória mostrada no log do servidor acima"
echo ""

# 4. Demonstrar reset de senha
echo "4. 🔄 Exemplo de reset de senha:"
echo "   PUT /api/users/reset-password"
echo "   Authorization: Bearer <token>"
echo "   Body: {"
echo "     \"currentPassword\": \"senha_provisoria\","
echo "     \"newPassword\": \"minha_nova_senha_123\""
echo "   }"
echo ""

echo "📋 ===== RESUMO DAS NOVAS FUNCIONALIDADES ====="
echo ""
echo "✅ Registro com senha provisória"
echo "✅ Envio de email simulado com credenciais"
echo "✅ Login com verificação de expiração"
echo "✅ Reset de senha obrigatório para senhas provisórias"
echo "✅ Confirmação por email após mudança de senha"
echo ""

echo "🌐 Novas rotas disponíveis:"
echo "   POST /api/users/register-temp    # Registro com senha provisória"
echo "   PUT  /api/users/reset-password   # Redefinir senha"
echo ""

echo "🎯 Para testar completamente:"
echo "1. Observe os logs do servidor para ver o email simulado"
echo "2. Use a senha provisória gerada para fazer login"
echo "3. Execute reset de senha com o token recebido"
