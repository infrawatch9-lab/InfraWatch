#!/bin/bash

# Script para verificar dados de notificações no banco
echo "🔍 Verificando dados no banco de dados..."

cd /home/gkomba/sgoinfre/InfraWatch/backend

echo ""
echo "📊 Contando notificações no banco:"
echo "SELECT COUNT(*) as total_notifications FROM Notification;" | npx prisma db execute --stdin 2>/dev/null || echo "❌ Erro ao executar query"

echo ""
echo "📊 Contando usuários no banco:"
echo "SELECT COUNT(*) as total_users FROM User;" | npx prisma db execute --stdin 2>/dev/null || echo "❌ Erro ao executar query"

echo ""
echo "📊 Últimas 5 notificações:"
echo "SELECT id, title, content, timestamp, userId, isRead FROM Notification ORDER BY timestamp DESC LIMIT 5;" | npx prisma db execute --stdin 2>/dev/null || echo "❌ Erro ao executar query"

echo ""
echo "✅ Verificação concluída!"
