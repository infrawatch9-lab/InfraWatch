#!/bin/bash

# Script para verificar serviços e usuários associados
echo "🔍 Verificando serviços e usuários no banco..."

cd /home/gkomba/sgoinfre/InfraWatch/backend

echo ""
echo "📊 Serviços disponíveis:"
echo "SELECT id, name, type, status FROM Service LIMIT 10;" | npx prisma db execute --stdin 2>/dev/null || echo "❌ Erro ao buscar serviços"

echo ""
echo "📊 Verificando serviço ID 20:"
echo "SELECT s.id, s.name, s.type, s.status FROM Service s WHERE s.id = 20;" | npx prisma db execute --stdin 2>/dev/null || echo "❌ Serviço ID 20 não encontrado"

echo ""
echo "📊 Usuários no sistema:"
echo "SELECT id, name, email, role FROM User LIMIT 5;" | npx prisma db execute --stdin 2>/dev/null || echo "❌ Erro ao buscar usuários"

echo ""
echo "📊 Associações serviço-usuário:"
echo "SELECT sn.serviceId, sn.userId, u.name, u.email FROM ServiceNotification sn JOIN User u ON sn.userId = u.id LIMIT 10;" | npx prisma db execute --stdin 2>/dev/null || echo "❌ Erro ao buscar associações"

echo ""
echo "✅ Verificação concluída!"
